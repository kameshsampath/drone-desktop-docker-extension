import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Backdrop, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Row } from './Pipeline';
import { upsertSteps, dataLoadStatus, importPipelines, selectRows } from '../features/pipelinesSlice';
import { useAppDispatch } from '../app/hooks';
import { getDockerDesktopClient, md5 } from '../utils';
import { Event, EventStatus, Step } from '../features/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PipelinesTable = (props) => {
  const dispatch = useAppDispatch();
  const pipelinesStatus = useSelector(dataLoadStatus);
  const pipelines = useSelector(selectRows);

  useEffect(() => {
    if (pipelinesStatus === 'idle') {
      dispatch(importPipelines());
    }
  }, [pipelinesStatus, dispatch]);

  useEffect(() => {
    const ddClient = getDockerDesktopClient();
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
        '{{json .}}'
      ],
      {
        stream: {
          splitOutputLines: true,
          async onOutput(data) {
            const event = JSON.parse(data.stdout ?? data.stderr) as Event;
            if (!event) {
              return;
            }

            const stepContainerId = event.Actor['ID'];
            const pipelineID = md5(event.Actor.Attributes['io.drone.pipeline.dir']);
            const pipelineFQN = event.Actor.Attributes['io.drone.pipeline.name'];
            const stepName = event.Actor.Attributes['io.drone.step.name'];
            const stepImage = event.Actor.Attributes['image'];

            switch (event.status) {
              case EventStatus.START: {
                console.log('START %s', JSON.stringify(event.Actor));
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: 'start'
                  };
                  dispatch(
                    upsertSteps({
                      pipelineID,
                      step: stepInfo
                    })
                  );
                }
                break;
              }

              case EventStatus.STOP:
              case EventStatus.DIE:
              case EventStatus.KILL: {
                console.log('STOP/DIE/KILL %s', JSON.stringify(event));
                const exitCode = parseInt(event.Actor.Attributes['exitCode']);
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: exitCode === 0 ? 'done' : 'error'
                  };
                  dispatch(
                    upsertSteps({
                      pipelineID,
                      step: stepInfo
                    })
                  );
                }
                break;
              }
              case EventStatus.DESTROY: {
                console.log('DESTROY %s', JSON.stringify(event));
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: 'destroy'
                  };
                  dispatch(
                    upsertSteps({
                      pipelineID,
                      step: stepInfo
                    })
                  );
                }
                break;
              }
              default: {
                break;
              }
            }
          }
        }
      }
    );

    return () => {
      process.close();
    };
  }, []);

  return (
    <>
      <Backdrop
        sx={{
          backgroundColor: 'rgba(245,244,244,0.4)',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
        open={pipelinesStatus === 'loading'}
      >
        <CircularProgress color="info" />
      </Backdrop>
      <Table aria-label="pipelines list">
        <TableHead>
          <TableRow>
            <TableCell component="th" />
            <TableCell component="th">Name</TableCell>
            <TableCell component="th">Status</TableCell>
            <TableCell component="th">Actions</TableCell>
          </TableRow>
        </TableHead>
        {pipelinesStatus === 'loaded' && (
          <TableBody>
            {pipelines.map((row) => {
              return (
                <Row
                  key={row.id}
                  row={row}
                  pipelineStatus={row.status}
                />
              );
            })}
          </TableBody>
        )}
      </Table>
    </>
  );
};
