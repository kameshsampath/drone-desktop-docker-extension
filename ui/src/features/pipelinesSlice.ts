import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../app/store';
import { getDockerDesktopClient } from '../utils';
import { Pipeline, PipelinesState } from './types';

const initialState: PipelinesState = {
  status: 'idle',
  rows: []
};

const ddClient = getDockerDesktopClient();

export const importPipelines = createAsyncThunk('pipelines/loadPipelines', async () => {
  console.log('Loading pipelines from backend');
  const response = await ddClient.extension.vm.service.get('/pipelines') as Pipeline[];
  return response
});

export const pipelinesSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    loadPipelines: (state, action: PayloadAction<Pipeline[]>) => {
      state.status = 'loaded';
      state.rows = rowsFromPayload(action.payload);
    },
    addSteps: (state) => {
      console.log('add Steps');
    },
    updateSteps: (state) => {
      console.log('update Steps');
    },
    deleteSteps: (state) => {
      console.log('delete Steps');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(importPipelines.pending, (state) => {
        console.log("loading")
        state.status = 'loading';
        state.rows = [];
      })
      .addCase(importPipelines.fulfilled, (state, action) => {
        console.log("loaded")
        state.status = 'loaded';
        state.rows = rowsFromPayload(action.payload);
      })
      .addCase(importPipelines.rejected, (state) => {
        console.log("failed")
        state.status = 'failed';
        state.rows = [];
      });
  }
});

function rowsFromPayload(payload: Pipeline[]) {
  console.log("Received Payload " + JSON.stringify(payload))
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

export const { loadPipelines, addSteps, deleteSteps, updateSteps } = pipelinesSlice.actions;

export const selectRows = (state: RootState) => state.pipelines.rows;
export const dataLoadStatus = (state: RootState) => state.pipelines.status;

export default pipelinesSlice.reducer;
