
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

export function pipelineFQN(pipelinePath:string, pipelineName:string):string {
    if (pipelineName.indexOf("/") != -1 ){
        pipelineName = pipelineName.split("/")[1]
    }
    return `${pipelinePath.replaceAll("/", "-")}~~${pipelineName}`
}

export function vscodeURI(pipelinePath:string): string {
    return `vscode://file${pipelinePath}?windowId=_blank`;
}