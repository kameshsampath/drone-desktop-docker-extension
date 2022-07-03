import { createDockerDesktopClient } from '@docker/extension-api-client'
import { DockerDesktopClient } from '@docker/extension-api-client-types/dist/v1';
import {Md5} from 'ts-md5/dist/md5';
import * as _ from 'lodash';

let client : DockerDesktopClient;

export function getDockerDesktopClient() {
    if (!client){
        client = createDockerDesktopClient();
    }
    return client;
}
 
export enum EventStatus {
    START = 'start',
    DESTROY = 'destroy',
    STOP = 'stop',
    DIE = 'die',
    KILL = 'kill',
}
  
export interface Event {
    status: EventStatus;
    id: string;
    from: string;
    Actor: {
        Attributes: {
        [key: string]: string;
        };
    };
}

export interface StepInfo {
    stepContainerId: string,
    pipelineFQN: string,
    stepName: string,
    stepImage: string,
    status: string
}
export interface RowData {
    id: string,
    pipelineName: string,
    pipelinePath: string,
    pipelineFile: string,
    status: string, 
    steps: StepInfo[]
}

export function pipelineFQN(pipelinePath:string, pipelineName:string):string {
    if (pipelineName.indexOf("/") != -1 ){
        pipelineName = pipelineName.split("/")[1];
    }
    return `${pipelinePath.replaceAll("/", "-")}~~${pipelineName}`;
}

export function pipelineDisplayName(pipelinePath:string,pipelineName:string): string {
  const paths = pipelinePath.split("/");
  return `${paths[paths.length - 1]}/${pipelineName}`;
}

export function vscodeURI(pipelinePath:string): string {
    return `vscode://file${pipelinePath}?windowId=_blank`;
}

export function md5(str): string {
    return Md5.hashStr(str);
}

export function getPipelineStatus(steps: StepInfo[]):string {
    console.log("getPipelineStatus " + JSON.stringify(steps));
    
    if (steps && steps.length > 0) {
		const runningSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'start')
		if (runningSteps.length > 0) {
			return "start";
		}
		const erroredSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'error')
		if (erroredSteps.length > 0) {
			return 'error'
		}
		const allDoneSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'done')
		if (erroredSteps.length == 0 && runningSteps == 0 && allDoneSteps.length > 0) {
			return "done";
		}
	}

	return "unknown";
}