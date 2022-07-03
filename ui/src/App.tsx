import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ImportDialog from './components/ImportPipelineDialog';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import * as _ from 'lodash';

import { MyContext } from '.'
import {
  StepInfo,
  getPipelineStatus,
  getDockerDesktopClient,
  md5,
  Event,
  EventStatus
}
  from './utils'
import { Row } from './components/Pipeline';

export function App() {
  const context = useContext(MyContext);
  const [rows, setRows] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [reloadTable, setReloadTable] = useState<boolean>(false);
  const [loadingPipelines, setLoadingPipelines] = useState<boolean>(true);
  const [openImportDialog, setOpenImportDialog] =
    useState<boolean>(false);

  const ddClient = getDockerDesktopClient();

  useEffect(() => {
    const loadPipelines = async () => {
      try {
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
      rows.push({
        id: v.id,
        pipelinePath: v.pipelinePath,
        pipelineName: v.pipelineName?.replace(/[\n\r]/g, ''),
        pipelineFile: v.pipelineFile,
        status: v?.Status
      })
    });
    setRows(rows);
  }, [pipelines]);


  function refreshRow(rowId: string) {
    console.log("Refresh Steps for pipeline " + rowId);
    // update the corresponding row 
    _.find(rows, (r) => {
      console.log("Refresh Steps for row " + JSON.stringify(r));
    });
  }

  function stepper(steps, action) {
    const stepInfo = action.stepInfo
    const { stepContainerId, pipelineFQN, stepName, stepImage } = stepInfo
    const pipelineID = action.actor;
    switch (action.type) {
      case "add": {
        let newSteps = [stepInfo]
        if (steps.has(pipelineFQN)) {
          const oldSteps = steps.get(pipelineFQN)
          newSteps = _.unionBy(newSteps, oldSteps, (o) => o.stepName === stepName)
        }
        steps.set(pipelineFQN, newSteps)
        console.log("Added::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        refreshRow(pipelineID);
        break;
      }
      case "update": {
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
        refreshRow(pipelineID);
        break;
      }
      case "delete": {
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
        refreshRow(pipelineID);
        break;
      }
    }
  }


  const pipelineSteps = new Map<string, StepInfo[]>();
  const [steps, dispatch] = useReducer(stepper, pipelineSteps);

  function startStepListener() {

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
            const event = JSON.parse(data.stdout ?? data.stderr) as Event;
            if (!event) {
              return;
            }

            const stepContainerId = event.Actor["ID"];
            const pipelineID = md5(event.Actor.Attributes["io.drone.pipeline.dir"]);
            const pipelineFQN = event.Actor.Attributes["io.drone.pipeline.name"];
            const stepName = event.Actor.Attributes["io.drone.step.name"];
            const stepImage = event.Actor.Attributes["image"];

            switch (event.status) {
              case EventStatus.START: {
                console.log("START %s", JSON.stringify(event.Actor))
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
                    actor: pipelineID,
                    type: "add"
                  })
                }
                break;
              }

              case EventStatus.STOP:
              case EventStatus.DIE:
              case EventStatus.KILL: {
                console.log("STOP/DIE/KILL %s", JSON.stringify(event))
                const exitCode = event.Actor.Attributes["exitCode"];
                if (pipelineFQN && stepName) {
                  const stepInfo: StepInfo = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "update"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineID,
                    exitCode,
                    type: "update"
                  })

                }
                break;
              }
              case EventStatus.DESTROY: {
                console.log("DESTROY %s", JSON.stringify(event))
                if (pipelineFQN && stepName) {
                  const stepInfo: StepInfo = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "destroy"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineID,
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

  useCallback(StartContainerListener, [rows])

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
          Do Continuous Integrations (CI) on your computer.
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
              {rows.map((row) => {
                return (
                  <Row
                    key={row.id}
                    row={row}
                    pipelineStatus={getPipelineStatus(row.steps)} />
                )
              })}
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
