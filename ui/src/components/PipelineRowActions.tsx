import { IconButton, Stack, Tooltip } from '@mui/material';
import { vscodeURI } from '../utils';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { useState } from 'react';
import RemovePipelineDialog from './RemovePipelineDialog';

export const PipelineRowActions = (props: {
  pipelineID: string;
  workspacePath: string;
  pipelineName: string;
  pipelineFile: string;
}) => {
  const { pipelineID, pipelineFile, pipelineName, workspacePath } = props;
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);

  const handleDeletePipeline = () => {
    setDeleteConfirmDialog(true);
  };

  const handleImportDialogClose = () => {
    setDeleteConfirmDialog(false);
  };

  return (
    <Stack
      direction="row"
      spacing={2}
    >
      <Tooltip title="Open in VS Code">
        <IconButton
          aria-label="edit in vscode"
          color="primary"
          href={vscodeURI(workspacePath)}
        >
          <img
            src="/images/vscode.png"
            width="16"
          />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove Pipeline">
        <IconButton onClick={handleDeletePipeline}>
          <RemoveCircleIcon color="error" />
        </IconButton>
      </Tooltip>
      {deleteConfirmDialog && (
        <RemovePipelineDialog
          open={deleteConfirmDialog}
          pipelineFile={pipelineFile}
          pipelineName={pipelineName}
          pipelineID={pipelineID}
          onClose={handleImportDialogClose}
        />
      )}
    </Stack>
  );
};
