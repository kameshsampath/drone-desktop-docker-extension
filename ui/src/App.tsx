import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Grid, Stack, Typography } from '@mui/material';
import ImportDialog from './components/ImportPipelineDialog';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { PipelinesTable } from './components/Pipelines';
import { dataLoadStatus, selectRows } from './features/pipelinesSlice';

export function App() {
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const pipelinesStatus = useSelector(dataLoadStatus);
  const pipelines = useSelector(selectRows);

  //console.log('Pipeline Status ' + pipelines.length);

  /* Handlers */
  const handleImportPipeline = () => {
    setOpenImportDialog(true);
  };

  const handleImportDialogClose = () => {
    setOpenImportDialog(false);
  };
  /* End of Handlers */

  return (
    <>
      <Stack
        direction="column"
        alignItems="start"
        spacing={2}
        sx={{ mt: 4 }}
      >
        <Typography variant="h3">Drone Pipelines</Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Do Continuous Integrations (CI) on your computer.
        </Typography>
        {pipelines.length != 0 && (
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={4}
            >
              <Button
                variant="contained"
                onClick={handleImportPipeline}
                endIcon={<AddCircleIcon />}
              >
                Import Pipelines
              </Button>
            </Grid>
          </Grid>
        )}
        {pipelines.length === 0 && (
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={4}
            >
              <Typography variant="body1">
                Looks like no pipelines has been imported yet, click Import Pipelines to import few from your local
                machine.
              </Typography>
            </Grid>
            <Grid
              item
              xs={4}
            >
              <Button
                variant="contained"
                onClick={handleImportPipeline}
                endIcon={<AddCircleIcon />}
              >
                Import Pipelines
              </Button>
            </Grid>
          </Grid>
        )}
        {pipelines.length > 0 && <PipelinesTable />}
        {openImportDialog && (
          <ImportDialog
            open={openImportDialog}
            onClose={handleImportDialogClose}
          />
        )}
      </Stack>
    </>
  );
}
