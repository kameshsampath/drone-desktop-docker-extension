import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../app/store';
import { getDockerDesktopClient } from '../utils';
import { Pipeline, PipelinesState, StepPayload } from './types';
import * as _ from 'lodash';

const initialState: PipelinesState = {
  status: 'idle',
  rows: []
};

const ddClient = getDockerDesktopClient();

const computePipelineStatus = (state, pipelineId) => {
  const pipeline = _.find(state.rows, { id: pipelineId });
  if (pipeline) {
    const steps = pipeline.steps;

    const runningSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'start');
    if (runningSteps.length > 0) {
      return 'start';
    }

    const erroredSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'error');
    if (erroredSteps.length > 0) {
      return 'error';
    }

    const allDoneSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'done');
    if (erroredSteps.length == 0 && runningSteps == 0 && allDoneSteps.length > 0) {
      return 'done';
    }
  }
};

export const importPipelines = createAsyncThunk('pipelines/loadPipelines', async () => {
  //console.log('Loading pipelines from backend');
  const response = (await ddClient.extension.vm.service.get('/pipelines')) as Pipeline[];
  return response;
});

export const pipelinesSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    loadPipelines: (state, action: PayloadAction<Pipeline[]>) => {
      state.status = 'loaded';
      state.rows = rowsFromPayload(action.payload);
    },
    upsertSteps: (state, action: PayloadAction<StepPayload>) => {
      //console.log("Action::" + action.type + "::" + JSON.stringify(action.payload));
      const { pipelineID, step } = action.payload;
      const idx = _.findIndex(state.rows, { id: pipelineID });
      if (idx != -1) {
        //console.log("Found::" + idx + "::" + JSON.stringify(state.rows[idx]));
        state.rows[idx].steps = _.unionBy([step], state.rows[idx].steps, 'name');
        updatePipelineStatus(state, pipelineID);
      }
    },
    deleteSteps: (state, action: PayloadAction<StepPayload>) => {
      //console.log("Action::" + action.type + "::" + action.payload);
      const { pipelineID, step } = action.payload;
      const idx = _.findIndex(state.rows, { id: pipelineID });
      if (idx != -1) {
        const j = _.findIndex(state.rows[idx].steps, { name: step.stepName });
        state.rows[idx].steps.splice(j, 1);
      }
    },
    pipelineStatus: (state, action: PayloadAction<string>) => {
      //console.log("Action::pipelineStatus::Payload" + action.payload);
      const pipelineID = action.payload;
      updatePipelineStatus(state, pipelineID);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(importPipelines.pending, (state) => {
        state.status = 'loading';
        state.rows = [];
      })
      .addCase(importPipelines.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.rows = rowsFromPayload(action.payload);
      })
      .addCase(importPipelines.rejected, (state) => {
        state.status = 'failed';
        state.rows = [];
      });
  }
});

function updatePipelineStatus(state, pipelineId: string) {
  //console.log("Update Pipeline Status..")
  const status = computePipelineStatus(state, pipelineId);
  const idx = _.findIndex(state.rows, { id: pipelineId });
  if (idx != -1) {
    state.rows[idx].status = status;
  }
}

function rowsFromPayload(payload: Pipeline[]) {
  //console.log("Received Payload " + JSON.stringify(payload))
  const rows = [];
  payload.map((v) => {
    rows.push({
      id: v.id,
      pipelinePath: v.pipelinePath,
      pipelineName: v.pipelineName?.replace(/[\n\r]/g, ''),
      pipelineFile: v.pipelineFile,
      status: v?.status
    });
  });
  return rows;
}

export const { loadPipelines, pipelineStatus, upsertSteps, deleteSteps } = pipelinesSlice.actions;

export const selectRows = (state: RootState) => state.pipelines.rows;
export const dataLoadStatus = (state: RootState) => state.pipelines.status;

export default pipelinesSlice.reducer;
