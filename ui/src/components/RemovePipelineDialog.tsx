import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography
} from '@mui/material';
import React from 'react';
import { useAppDispatch } from '../app/hooks';
import { removePipeline } from '../features/pipelinesSlice';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export default function RemovePipelineDialog({ ...props }) {
  const dispatch = useAppDispatch();
  const [actionInProgress, setActionInProgress] = React.useState<boolean>(false);

  const handleDeletePipeline = () => {
    setActionInProgress(true);
    dispatch(removePipeline(props.pipelineID));
    setActionInProgress(false);
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>Remove pipeline ?</DialogTitle>
      <DialogContent>
        <Backdrop
          sx={{
            backgroundColor: 'rgba(245,244,244,0.4)',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
          open={actionInProgress}
        >
          <CircularProgress color="info" />
        </Backdrop>

        <Grid
          container
          direction="column"
          spacing={2}
        >
          <Grid item>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Do you want to remove the pipeline "{props.pipelineName}" defined in "{props.pipelineFile}"?
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            props.onClose();
          }}
          endIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDeletePipeline}
          endIcon={<RemoveCircleIcon />}
        >
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
}
