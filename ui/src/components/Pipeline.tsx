import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { Fragment, useState } from "react";
import { pipelineDisplayName } from "../utils";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RunCircleIcon from '@mui/icons-material/RunCircle';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import * as _ from 'lodash';
import * as utils from "../utils";

import { MyContext } from '..'
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import { Step } from "./PipelineStep";

export const Row = (props: { row: utils.RowData }) => {
	const { row } = props;
	const [open, setOpen] = useState(false);

	function usePipelineStatus(steps: utils.StepInfo[]) {
		console.log(" usePipelineStatus " + JSON.stringify(steps));
		if (steps && steps.length > 0) {
			const runningSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'start')
			if (runningSteps.length > 0) {
				return (
					<RunCircleIcon color='warning' />
				)
			}
			const erroredSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'error')
			if (erroredSteps.length > 0) {
				return (
					<ErrorIcon color='error' />
				)
			}
			const allDoneSteps = _.filter(steps, (s) => s.status?.toLowerCase() === 'done')
			if (erroredSteps.length == 0 && runningSteps == 0 && allDoneSteps.length > 0) {
				return (
					<CheckCircleIcon color='success' />
				)
			}
		}
		return <QuestionMarkIcon color='action' />
	}

	return (
		<Fragment>
			<TableRow sx={{ '& > *': { borderTop: 'unset', borderBottom: 'unset' } }}>
				<TableCell>
					<IconButton
						aria-label="expand row"
						size="small"
						onClick={() => setOpen(!open)}
					>
						{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
					</IconButton>
				</TableCell>
				<Tooltip title={row.pipelineFile}>
					<TableCell component="th" scope="row">
						{pipelineDisplayName(row.pipelinePath, row.pipelineName)}
					</TableCell>
				</Tooltip>
				<TableCell component="th" scope="row">
					{row.steps && usePipelineStatus(row.steps)}
				</TableCell>
				<TableCell>
					<Tooltip title="Open in VS Code">
						<IconButton
							aria-label="edit in vscode"
							color="primary"
							href={utils.vscodeURI(row.pipelinePath)}>
							<img src="/images/vscode.png" width="24" />
						</IconButton>
					</Tooltip>
				</TableCell>
			</TableRow>
			{
				row.steps && <TableRow sx={{ '& > *': { borderTop: 'unset', borderBottom: 'unset' } }}>
					<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
						<Collapse in={open} timeout="auto" unmountOnExit>
							<Box>
								<Typography variant="h6" gutterBottom component="div">
									Steps
								</Typography>
								<Table size="small" aria-label="steps">
									<TableHead>
										<TableRow>
											<TableCell>Name</TableCell>
											<TableCell>Container</TableCell>
											<TableCell>Status</TableCell>
											<TableCell>Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{row.steps && row.steps.map((step) => (
											<Step key={step.stepContainerId} row={step} />
										))}
									</TableBody>
								</Table>
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			}
		</Fragment >
	)
}