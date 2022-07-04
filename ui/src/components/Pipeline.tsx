import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { Fragment, useState } from "react";
import { pipelineDisplayName } from "../utils";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from "@mui/material/Collapse";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";


import { PipelineStep } from "./PipelineStep";
import { PipelineStatus } from "./PipelineStatus";

import * as _ from 'lodash';
import { EditInVSCode } from "./VSCodeEdit";
import { Pipeline } from "../features/types";

interface RowProps {
	row: Pipeline
	pipelineStatus: string
}

export const Row = (props: RowProps) => {
	const { row, pipelineStatus } = props;
	const [open, setOpen] = useState(false);

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
					<PipelineStatus status={pipelineStatus} />
				</TableCell>
				<TableCell>
					<EditInVSCode workspacePath={row.pipelinePath} />
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
											<PipelineStep key={step.stepContainerId} row={step} />
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