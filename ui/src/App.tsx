import React, { useContext, useEffect } from 'react'
import { createDockerDesktopClient } from '@docker/extension-api-client'
import { Backdrop, Button, CircularProgress, Grid, IconButton, LinearProgress, Stack, Typography } from '@mui/material'

import { MyContext } from '.'
import { DataGrid } from '@mui/x-data-grid'
import { DockerDesktopClient } from '@docker/extension-api-client-types/dist/v1'
import { AddCircle } from '@mui/icons-material'
import ImportDialog from './components/ImportPipelineDialog'

const client = createDockerDesktopClient()

function useDockerDesktopClient(): DockerDesktopClient {
  return client
}

export function App() {
  const context = useContext(MyContext);
  const [rows, setRows] = React.useState([]);
  const [pipelines, setPipelines] = React.useState([]);
  const [actionInProgress, setActionInProgress] =
    React.useState<boolean>(false);
  const [reloadTable, setReloadTable] = React.useState<boolean>(false);
  const [loadingPipelines, setLoadingPipelines] = React.useState<boolean>(true);
  const [openImportDialog, setOpenImportDialog] =
    React.useState<boolean>(false);

  const ddClient = useDockerDesktopClient()

  useEffect(() => {
    const loadPipelines = async () => {
      try {
        console.log("Loading Pipelines ...")
        if (context.store.pipelines.length === 0){
           setLoadingPipelines(true)
           const output = await ddClient.extension.vm.service.get("/pipelines");
           context.store.pipelines = output
           setLoadingPipelines(false)
        }
        const pipelines = context.store.pipelines
        console.log("Current Pipelines %s", JSON.stringify(pipelines))
        console.log("pipelinesJson %s", Object.entries(pipelines))
        setPipelines(pipelines);
      } catch (e) {
        setLoadingPipelines(false);
        ddClient.desktopUI.toast.error(e);
      } finally {
        setLoadingPipelines(false);
      }
    }
    loadPipelines();
  }, []);

  useEffect(() => {
    const rows = [];
    pipelines.map(v => {
      rows.push({
        id: v.id,
        pipelineName: v.name,
        path: v.path,
        status: v?.Status
      })
    });
    setRows(rows);
  }, [pipelines]);

  const columns = [
    { field: "id", headerName: "ID", hide: true },
    { field: "pipelineName", headerName: "Pipeline", flex: 1 },
    {
      field: "stepContainers",
      headerName: "Steps",
      flex: 1,
      renderCell: (params) => {

        return <></>;
      },
    },
    { field: "status", headerName: "Status", width: 70 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      minWidth: 220,
      sortable: false,
      flex: 1,
      getActions: (params) => []
    }
  ];

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
        <Grid container>
          <Grid item flex={1}>
            <Backdrop
              sx={{
                backgroundColor: "rgba(245,244,244,0.4)",
                zIndex: (theme) => theme.zIndex.drawer + 1,
              }}
              open={actionInProgress}
            >
              <CircularProgress color="info" />
            </Backdrop>
            <DataGrid
              loading={loadingPipelines}
              components={{
                LoadingOverlay: LinearProgress,
              }}
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              checkboxSelection={false}
              disableSelectionOnClick={true}
              autoHeight
              getRowHeight={() => "auto"}
              sx={{
                "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": {
                  py: 1,
                },
                "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": {
                  py: 1,
                },
                "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell": {
                  py: 2,
                },
              }}
            />
          </Grid>
          {openImportDialog && (
            <ImportDialog
              open={openImportDialog}
              onClose={handleImportDialogClose}
            />
          )}
        </Grid>
      </Stack>
    </>
  );

}
