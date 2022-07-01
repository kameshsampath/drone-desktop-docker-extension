import React, { Fragment, useContext, useEffect, useState } from 'react'
import { createDockerDesktopClient } from '@docker/extension-api-client'
import { Box, Button, Collapse, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { AddCircle, CheckCircle, Error, RunCircle } from '@mui/icons-material'
import TerminalIcon from '@mui/icons-material/Terminal';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';
import ArticleIcon from '@mui/icons-material/Article';
import ImportDialog from './components/ImportPipelineDialog'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';

import * as _ from 'lodash';

import { MyContext } from '.'
import * as utils from './utils'
import { StepInfo } from './utils'

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}


export function App() {
  const context = useContext(MyContext);
  const [rows, setRows] = React.useState([]);
  const [pipelines, setPipelines] = React.useState([]);
  const [stepContainers] = React.useState<Map<string, StepInfo[]>
  >(new Map<string, StepInfo[]>());
  const [reloadTable, setReloadTable] = React.useState<boolean>(false);
  const [reloadSteps, setReloadSteps] = React.useState<boolean>(false);
  const [loadingPipelines, setLoadingPipelines] = React.useState<boolean>(true);
  const [openImportDialog, setOpenImportDialog] =
    React.useState<boolean>(false);

  const ddClient = useDockerDesktopClient()

  function refreshData(
    rowId: string,
    pipelinePath: string,
    pipelineName: string,
    status: string
  ) {
    const pipelineFQN = utils.pipelineFQN(pipelinePath, pipelineName);
    const steps = stepContainers.get(pipelineFQN);

    console.log("Refresh Data " + pipelineFQN + " Steps " + JSON.stringify(steps))

    //TODO revisit logic
    if (steps && steps.length > 0) {
      const runningSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'start')
      if (runningSteps.length > 0) {
        status = "run"
      }
      const erroredSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'error')
      if (erroredSteps.length > 0) {
        status = "error"
      }
      const allDoneSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'done')
      if (erroredSteps.length == 0 && runningSteps == 0 && allDoneSteps.length > 0) {
        status = "done"
      }
    }
    return {
      id: rowId,
      pipelineName,
      pipelinePath,
      status,
      steps
    }
  }
  useEffect(() => {
    const loadPipelines = async () => {
      try {
        console.log("Loading Pipelines ...")
        if (context.store.pipelines.length === 0) {
          setLoadingPipelines(true)
          const output = await ddClient.extension.vm.service.get("/pipelines");
          context.store.pipelines = output
          setLoadingPipelines(false)
        }
        const pipelines = context.store.pipelines
        console.log("Available Pipelines %s", JSON.stringify(pipelines))
        setPipelines(pipelines);
      } catch (e) {
        setLoadingPipelines(false);
        ddClient.desktopUI.toast.error(e);
      } finally {
        setLoadingPipelines(false);
      }
    }
    loadPipelines();
  }, [reloadTable]);

  useEffect(() => {
    const rows = [];
    pipelines.map(v => {
      rows.push(refreshData(v.id, v.path, v.name?.replace(/[\n\r]/g, ''), v?.Status))
    });
    setRows(rows);
  }, [pipelines, reloadSteps]);

  useEffect(() => {
    console.log("Gathering containers for the pipelines...")
    //TODO gather all running containers for this pipeline query by labels
    const process = ddClient.docker.cli.exec(
      'events',
      [
        '--filter',
        'type=container',
        '--filter',
        'event=start',
        '--filter',
        'event=stop',
        '--filter',
        'event=kill',
        '--filter',
        'event=die',
        '--filter',
        'event=destroy',
        '--format',
        '{{json .}}',
      ],
      {
        stream: {
          splitOutputLines: true,
          async onOutput(data) {
            const event = JSON.parse(data.stdout ?? data.stderr) as utils.Event;

            if (!event) {
              return;
            }

            switch (event.status) {
              case utils.EventStatus.START: {
                console.log("START %s", JSON.stringify(event.Actor))
                const stepContainerId = event.Actor["ID"]
                const pipelineFQN = event.Actor.Attributes["io.drone.pipeline.name"];
                const stepName = event.Actor.Attributes["io.drone.step.name"];
                const stepImage = event.Actor.Attributes["image"];
                if (pipelineFQN && stepName) {
                  const stepInfo: StepInfo = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "start"
                  }
                  let newSteps = [stepInfo]
                  if (stepContainers.has(pipelineFQN)) {
                    const oldSteps = stepContainers.get(pipelineFQN)
                    newSteps = _.unionBy(newSteps, oldSteps, (o) => o.stepName === stepName)
                  }
                  stepContainers.set(pipelineFQN, newSteps)
                  console.log("Steps for " + pipelineFQN + " " + JSON.stringify(stepContainers.get(pipelineFQN)))
                  setReloadTable(!reloadTable)
                  setReloadSteps(!reloadSteps)
                }
                break;
              }

              case utils.EventStatus.STOP:
              case utils.EventStatus.DIE:
              case utils.EventStatus.KILL: {
                console.log("STOP/DIE/KILL %s", JSON.stringify(event))
                const exitCode = event.Actor.Attributes["exitCode"];
                const stepContainerId = event.Actor["ID"]
                const pipelineFQN = event.Actor.Attributes["io.drone.pipeline.name"];
                const stepName = event.Actor.Attributes["io.drone.step.name"];
                const stepImage = event.Actor.Attributes["image"];
                if (pipelineFQN && stepName) {
                  if (stepContainers.has(pipelineFQN)) {
                    const steps = stepContainers.get(pipelineFQN)
                    const i = _.findIndex(steps, { stepContainerId });
                    steps[i] = {
                      stepContainerId,
                      pipelineFQN,
                      stepName,
                      stepImage,
                      status: exitCode === "0" ? "done" : "error"
                    };
                    stepContainers.set(pipelineFQN, steps)
                    console.log("Updated Steps for " + pipelineFQN + " " + JSON.stringify(stepContainers.get(pipelineFQN)))
                    setReloadTable(!reloadTable)
                    setReloadSteps(!reloadSteps)
                  }
                }
                break;
              }
              case utils.EventStatus.DESTROY: {
                console.log("DESTROY %s", JSON.stringify(event))
                const exitCode = event.Actor.Attributes["exitCode"];
                const stepContainerId = event.Actor["ID"]
                const pipelineFQN = event.Actor.Attributes["io.drone.pipeline.name"];
                const stepName = event.Actor.Attributes["io.drone.step.name"];
                const stepImage = event.Actor.Attributes["image"];
                if (pipelineFQN && stepName) {
                  if (stepContainers.has(pipelineFQN)) {
                    const steps = stepContainers.get(pipelineFQN)
                    const i = _.findIndex(steps, { stepContainerId });
                    steps[i] = {
                      stepContainerId,
                      pipelineFQN,
                      stepName,
                      stepImage,
                      status: "destroy"
                    };
                    stepContainers.set(pipelineFQN, steps)
                    console.log("Updated Steps for " + pipelineFQN + " " + JSON.stringify(stepContainers.get(pipelineFQN)))
                    setReloadTable(!reloadTable)
                    setReloadSteps(!reloadSteps)
                  }
                }
                break;
              }
              default: {
                break;
              }
            }

          },
        },
      },
    );

    return () => {
      process.close();
    };
  }, [pipelines]);

  function Step(props: { row: StepInfo }) {
    const { row } = props
    console.log("Adding Steps " + JSON.stringify(row))

    const handleStepLogs = (step: StepInfo) => {
      console.log("Handle Step Logs");
    }


    return (
      <Fragment>
        <TableRow key={row.stepContainerId}>
          <TableCell>{row.stepName}</TableCell>
          <TableCell>{row.stepImage} </TableCell>
          <TableCell>
            {row.status === "done" && <CheckCircle />}
            {row.status === "start" && <RunCircle />}
            {row.status === "error" && <Error />}
            {row.status === "destroy" && <RemoveDoneIcon color="info" />}
          </TableCell>
          <TableCell>
           { row.status !== "destroy" && <IconButton color="primary"
              hidden={ row.status !== "destroy"}
              onClick={() => handleStepLogs(row)} >
              <ArticleIcon />
            </IconButton>
          }
          </TableCell>
        </TableRow>
      </Fragment>
    )
  }

  function Row(props: { row: ReturnType<typeof refreshData> }) {
    const { row } = props;
    const [open, setOpen] = useState(false);
    const [openInVsCode, setOpenInVsCode] = useState(false);

    const handleOpenInVsCode = (pipelinePath: string) => {
      console.log(`Open ${pipelinePath} in vscode`);
    }
    return (
      <Fragment>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            {row.pipelineName}
          </TableCell>
          <TableCell component="th" scope="row">
            {row.status === "start" && <RunCircle color='warning' />}
            {row.status === "done" && <CheckCircle color='success' />}
            {row.status === "error" && <CheckCircle color='error' />}
          </TableCell>
          <TableCell>
            <IconButton
              aria-label="edit in vscode"
              color="primary"
              onClick={() => handleOpenInVsCode(row.pipelinePath)}>
              <EditIcon />
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  Steps
                </Typography>
                <Table size="small" aria-label="steps">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Container</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.steps && row.steps.map((step) => (
                      <Step key={step.stepContainerId} row={step} />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </Fragment>
    )
  }

  /* Handlers */
  const handleImportPipeline = () => {
    setOpenImportDialog(true);
  }

  const handleImportDialogClose = () => {
    setOpenImportDialog(false);
    setReloadTable(!reloadTable);
  }
  /* End of Handlers */

  return (
    <>
      <Typography variant="h3">Drone Pipelines</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Do Continuos Integrations(CI) on your laptop.
      </Typography>
      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleImportPipeline}
          endIcon={<AddCircle />}>
          Add Pipeline
        </Button>
        <TableContainer component={Paper}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <Row key={row.name} row={row} />
              ))}
            </TableBody>
          </Table>
          {openImportDialog && (
            <ImportDialog
              open={openImportDialog}
              onClose={handleImportDialogClose}
            />
          )}
        </TableContainer>
      </Stack>
    </>
  );

}
