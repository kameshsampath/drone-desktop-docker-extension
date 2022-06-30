import React, { useContext } from "react";
import {
  Button,
  Typography,
  Grid,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { createDockerDesktopClient } from "@docker/extension-api-client";

import { MyContext } from "../index";
import * as YAML from "js-yaml";

const client = createDockerDesktopClient();


function useDockerDesktopClient() {
  return client;
}

export default function ImportDialog({ ...props }) {
  console.log("Add Pipeline component rendered.");
  const ddClient = useDockerDesktopClient();

  const context = useContext(MyContext);
  const fileName = `.drone.yml`;

  const [path, setPath] = React.useState<string>("");
  const [actionInProgress, setActionInProgress] =
    React.useState<boolean>(false);

  const selectDronePipelineFile = () => {
    ddClient.desktopUI.dialog
      .showOpenDialog({
        properties: ["openFile", "showHiddenFiles"],
        filters: [{ name: ".drone.yml", extensions: ["drone.yml"] }], // should contain extension without wildcards or dots
      })
      .then((result) => {
        if (result.canceled) {
          return;
        }

        setPath(result.filePaths[0]);
      });
  };

  const savePipelines = async () => {
    setActionInProgress(true);

    try {
      const paths = path.split("/")
      //console.log("Paths %s", paths)
      const pipelinePaths = paths.splice(0, paths.length - 1)
      const pipelinePath = pipelinePaths.join("/");
      //TODO choose the right seperator
      //console.log("pipelinePath %s ", pipelinePath)
      const pipelineNameOut = await ddClient.extension.host.cli.exec("yq", ["-r ", "'.name'", path])

      if (pipelineNameOut.stderr !== "") {
        ddClient.desktopUI.toast.error(pipelineNameOut.stderr);
        return;
      }

      const pipelineName = `${pipelinePaths[pipelinePaths.length - 1]}/${pipelineNameOut.stdout}`
      //console.log("Pipeline Name %s",pipelineName)

      const pipelines = await ddClient.extension.vm.service.post("/pipeline", [{
        "name": pipelineName,
        "path": pipelinePath
      }]);

      console.log("OUTPUT %s", JSON.stringify(pipelines))

      if (pipelines) {
        context.store.pipelines = pipelines
        ddClient.desktopUI.toast.success(
          `Successfully imported pipelines`
        );
      }

    } catch (error) {
      console.log(error)
      ddClient.desktopUI.toast.error(
        `Error importing pipeline  ${path} Exit code: ${error.code}`
      );
    } finally {
      setActionInProgress(false);
      setPath("");
      props.onClose();
    }
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Import and Run Pipeline</DialogTitle>
      <DialogContent>
        <Backdrop
          sx={{
            backgroundColor: "rgba(245,244,244,0.4)",
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
          open={actionInProgress}
        >
          <CircularProgress color="info" />
        </Backdrop>
        <DialogContentText>
          Imports a Drone pipeline and runs it.
        </DialogContentText>

        <Grid container direction="column" spacing={2}>
          <Grid item>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Choose a .drone.yml to import and run, e.g. .drone.yml
            </Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={selectDronePipelineFile}>
              Select file
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setPath("");
            props.onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={savePipelines}
          disabled={path === ""}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
