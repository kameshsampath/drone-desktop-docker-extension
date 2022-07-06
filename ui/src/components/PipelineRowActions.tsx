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
  const { pipelineID, workspacePath } = props;
  const [removeConfirm, setRemoveConfirm] = useState(false);

  const handleDeletePipelines = () => {
    setRemoveConfirm(true);
  };

  const handleRemoveDialogClose = () => {
    setRemoveConfirm(false);
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
            src={process.env.PUBLIC_URL + '/images/vscode.png'}
            width="16"
          />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove Pipeline">
        <IconButton onClick={handleDeletePipelines}>
          <RemoveCircleIcon color="error" />
        </IconButton>
      </Tooltip>
      {removeConfirm && (
        <RemovePipelineDialog
          open={removeConfirm}
          selectedToRemove={[pipelineID]}
          onClose={handleRemoveDialogClose}
        />
      )}
    </Stack>
  );
};
