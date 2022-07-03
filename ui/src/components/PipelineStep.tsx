import { Fragment, useState } from "react";

import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import ArticleIcon from '@mui/icons-material/Article';

import * as _ from 'lodash';
import * as utils from "../utils";
import { StepStatus } from "./StepStatus";

export const Step = (props: { row: utils.StepInfo }) => {
  const { row } = props;
  console.log("Adding Steps " + JSON.stringify(row))

  const ddClient = utils.getDockerDesktopClient();

  const handleStepLogs = (step: utils.StepInfo) => {
    console.log("Handle Step Logs for step %", JSON.stringify(step));
    const process = ddClient.docker.cli.exec(
      'logs',
      [
        "--details",
        "--follow",
        step.stepContainerId
      ],
      {
        stream: {
          splitOutputLines: true,
          onOutput(data) {
            if (data.stdout) {
              console.error(data.stdout);
            } else {
              console.log(data.stderr);
            }
          },
          onError(error) {
            console.error(error);
          },
          onClose(exitCode) {
            console.log("onClose with exit code " + exitCode);
          }
        }
      }
    );

    return () => {
      process.close();
    }
  }

  return (
    <Fragment>
      <TableRow key={row.stepContainerId} sx={{ '& > *': { borderTop: 'unset', borderBottom: 'unset' } }}>
        <TableCell>{row.stepName}</TableCell>
        <TableCell>{row.stepImage} </TableCell>
        <TableCell>
          <StepStatus status={row.status} />
        </TableCell>
        <TableCell>
          {row.status !== "destroy" && <IconButton color="primary"
            hidden={row.status !== "destroy"}
            onClick={() => handleStepLogs(row)} >
            <ArticleIcon />
          </IconButton>
          }
        </TableCell>
      </TableRow>
    </Fragment>
  )
}