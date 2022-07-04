 
  function PipelineLoader() {
    const [state, dispatch] = useReducer(reducer, initialState)
    async () => {
      try {
        const data = await ddClient.extension.vm.service.get("/pipelines") as Pipeline[];
        dispatch({ action: "pipelines", data })
      } catch (e) {
        ddClient.desktopUI.toast.error(e);
        return;
      }
    }
  }
  
 function stepper(steps, action) {
    const stepInfo = action.stepInfo
    const { stepContainerId, pipelineFQN, stepName, stepImage } = stepInfo
    const pipelineID = action.actor;
    switch (action.type) {
      case "add": {
        let newSteps = [stepInfo]
        if (steps.has(pipelineFQN)) {
          const oldSteps = steps.get(pipelineFQN)
          newSteps = _.unionBy(newSteps, oldSteps, (o) => o.stepName === stepName)
        }
        steps.set(pipelineFQN, newSteps)
        console.log("Added::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        refreshRow(pipelineID);
        break;
      }
      case "update": {
        if (steps.has(pipelineFQN)) {
          const tempSteps = steps.get(pipelineFQN)
          const i = _.findIndex(steps, { stepContainerId });
          steps[i] = {
            stepContainerId,
            pipelineFQN,
            stepName,
            stepImage,
            status: action.exitCode === "0" ? "done" : "error"
          };
          steps.set(pipelineFQN, tempSteps)
          console.log("Updated::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        }
        refreshRow(pipelineID);
        break;
      }
      case "delete": {
        if (steps.has(pipelineFQN)) {
          const tempSteps = steps.get(pipelineFQN)
          const i = _.findIndex(steps, { stepContainerId });
          steps[i] = {
            stepContainerId,
            pipelineFQN,
            stepName,
            stepImage,
            status: "destroy"
          };
          steps.set(pipelineFQN, tempSteps)
          console.log("Destroyed::Steps[" + pipelineFQN + "]: " + JSON.stringify(steps.get(pipelineFQN)))
        }
        refreshRow(pipelineID);
        break;
      }
    }
  }

 useEffect(() => {
    const rows = [];
    pipelines.map(v => {
      rows.push({
        id: v.id,
        pipelinePath: v.pipelinePath,
        pipelineName: v.pipelineName?.replace(/[\n\r]/g, ''),
        pipelineFile: v.pipelineFile,
        status: v?.Status
      })
    });
    setRows(rows);
  });


  function refreshRow(rowId: string) {
    console.log("Refresh Steps for pipeline " + rowId);
    // update the corresponding row 
    _.find(rows, (r) => {
      console.log("Refresh Steps for row " + JSON.stringify(r));
    });
  }


 function startStepListener() {

    console.log("Containers for the Pipelines:" + JSON.stringify(steps))

    const process = ddClient.docker.cli.exec(
      'events',
      [
        '--filter',
        'type=container',
        '--filter',
        'event=start',
        '--filter',
        'event=stop',
        '--filter',
        'event=kill',
        '--filter',
        'event=die',
        '--filter',
        'event=destroy',
        '--format',
        '{{json .}}',
      ],
      {
        stream: {
          splitOutputLines: true,
          async onOutput(data) {
            const event = JSON.parse(data.stdout ?? data.stderr) as Event;
            if (!event) {
              return;
            }

            const stepContainerId = event.Actor["ID"];
            const pipelineID = md5(event.Actor.Attributes["io.drone.pipeline.dir"]);
            const pipelineFQN = event.Actor.Attributes["io.drone.pipeline.name"];
            const stepName = event.Actor.Attributes["io.drone.step.name"];
            const stepImage = event.Actor.Attributes["image"];

            switch (event.status) {
              case EventStatus.START: {
                console.log("START %s", JSON.stringify(event.Actor))
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "start"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineID,
                    type: "add"
                  })
                }
                break;
              }

              case EventStatus.STOP:
              case EventStatus.DIE:
              case EventStatus.KILL: {
                console.log("STOP/DIE/KILL %s", JSON.stringify(event))
                const exitCode = event.Actor.Attributes["exitCode"];
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "update"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineID,
                    exitCode,
                    type: "update"
                  })

                }
                break;
              }
              case EventStatus.DESTROY: {
                console.log("DESTROY %s", JSON.stringify(event))
                if (pipelineFQN && stepName) {
                  const stepInfo: Step = {
                    stepContainerId,
                    pipelineFQN,
                    stepName,
                    stepImage,
                    status: "destroy"
                  }
                  dispatch({
                    stepInfo,
                    actor: pipelineID,
                    type: "delete"
                  })
                }
                break;
              }
              default: {
                break;
              }
            }

          },
        },
      },
    );

    return () => {
      process.close();
    };
  };