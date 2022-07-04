import { useState } from 'react'
import {
  Button,
  Stack,
  Typography
}
  from '@mui/material';
import ImportDialog from './components/ImportPipelineDialog';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { PipelinesTable } from './components/Pipelines';

export function App() {

  const [openImportDialog, setOpenImportDialog] =
    useState<boolean>(false);

  /* Handlers */
  const handleImportPipeline = () => {
    setOpenImportDialog(true);
  }

  const handleImportDialogClose = () => {
    setOpenImportDialog(false);
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
        <PipelinesTable />
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
