import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ImportDialog from './components/ImportPipelineDialog';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import * as _ from 'lodash';

import { MyContext } from '.'
import * as utils from './utils'
import { StepInfo } from './utils'
import { Row } from './components/Pipeline';

export function App() {
  const pipelineSteps = new Map<string, StepInfo[]>();
  function refreshData(
    rowId: string,
    pipelinePath: string,
    pipelineName: string,
    pipelineFile: string,
    status: string
  ): utils.RowData {
    return {
      id: rowId,
      pipelineName,
      pipelinePath,
      pipelineFile,
      status,
      steps: []
    }
  }

  const context = useContext(MyContext);
  const [rows, setRows] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [reloadTable, setReloadTable] = useState<boolean>(false);
  const [loadingPipelines, setLoadingPipelines] = useState<boolean>(true);
  const [openImportDialog, setOpenImportDialog] =
    useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const ddClient = utils.getDockerDesktopClient();

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
      rows.push(refreshData(v.id, v.pipelinePath, v.pipelineName?.replace(/[\n\r]/g, ''), v.pipelineFile, v?.Status))
    });
    setRows(rows);
  }, [pipelines]);


  function stepper(steps, action) {
    switch (action.type) {
      case "add": {
        const stepInfo = action.stepInfo;
        const pipelineFQN = action.actor;
        const stepName = stepInfo.stepName;
        let newSteps = [stepInfo]
        if (steps.has(pipelineFQN)) {
          const oldSteps = steps.get(pipelineFQN)
          newSteps = _.unionBy(newSteps, oldSteps, (o) => o.stepName === stepName)
        }
        steps.set(pipelineFQN, newSteps)
        console.log("Added::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        break;
      }
      case "update": {
        const stepInfo = action.stepInfo as utils.StepInfo;
        const stepContainerId = stepInfo.stepContainerId;
        const stepName = stepInfo.stepName;
        const stepImage = stepInfo.stepImage;
        const pipelineFQN = action.actor;
        if (steps.has(pipelineFQN)) {
          const tempSteps = steps.get(pipelineFQN)
          const i = _.findIndex(steps, { stepContainerId });
          steps[i] = {
            stepContainerId,
            pipelineFQN,
            stepName,
            stepImage,
            status: action.exitCode === "0" ? "done" : "error"
          };
          steps.set(pipelineFQN, tempSteps)
          console.log("Updated::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        }
        break;
      }
      case "delete": {
        const stepInfo = action.stepInfo as utils.StepInfo;
        const stepContainerId = stepInfo.stepContainerId;
        const stepName = stepInfo.stepName;
        const stepImage = stepInfo.stepImage;
        const pipelineFQN = action.actor;
        if (steps.has(pipelineFQN)) {
          const tempSteps = steps.get(pipelineFQN)
          const i = _.findIndex(steps, { stepContainerId });
          steps[i] = {
            stepContainerId,
            pipelineFQN,
            stepName,
            stepImage,
            status: "destroy"
          };
          steps.set(pipelineFQN, tempSteps)
          console.log("Destroyed::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        }
        break;
      }
    }
  }

  function containerListener() {
    const [steps, dispatch] = useReducer(stepper, pipelineSteps, (o => {
      o?.clear();
    }));

    console.log("Containers for the Pipelines:" + JSON.stringify(steps))

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
                  dispatch({
                    stepInfo,
                    actor: pipelineFQN,
                    type: "add"
                  })
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
                  const stepInfo: StepInfo = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "start"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineFQN,
                    exitCode,
                    type: "update"
                  })

                }
                break;
              }
              case utils.EventStatus.DESTROY: {
                console.log("DESTROY %s", JSON.stringify(event))
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
                  dispatch({
                    stepInfo,
                    actor: pipelineFQN,
                    type: "delete"
                  })
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
  };

  //start to listen to containers that are started/stopped/destroyed
  useCallback(containerListener, [rows])

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
      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        <Typography variant="h3">Drone Pipelines</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Do Continuos Integrations(CI) on your laptop.
        </Typography>
        <Button
          variant="contained"
          onClick={handleImportPipeline}
          endIcon={<AddCircleIcon />}>
          Add Pipeline
        </Button>
        <TableContainer component={Paper}>
          <Table aria-label="pipelines list">
            <TableHead>
              <TableRow>
                <TableCell component="th" />
                <TableCell component="th">Name</TableCell>
                <TableCell component="th">Status</TableCell>
                <TableCell component="th">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <Row key={row.id} row={row} />
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
