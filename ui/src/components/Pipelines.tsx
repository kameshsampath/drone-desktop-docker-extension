import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
	Backdrop,
	CircularProgress,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow
}
	from '@mui/material';
import { Row } from "./Pipeline";
import { getPipelineStatus } from "../utils";
import { dataLoadStatus, importPipelines, selectRows } from '../features/pipelinesSlice';
import { useAppDispatch } from "../app/hooks";

export const PipelinesTable = (props) => {
	const dispatch = useAppDispatch()
	const pipelinesStatus = useSelector(dataLoadStatus)
	const pipelines = useSelector(selectRows)

	useEffect(() => {
		if (pipelinesStatus === 'idle') {
			dispatch(importPipelines())
		}
	}, [pipelinesStatus, dispatch])

	return (
		<>
			<Backdrop
				sx={{
					backgroundColor: "rgba(245,244,244,0.4)",
					zIndex: (theme) => theme.zIndex.drawer + 1,
				}}
				open={pipelinesStatus === 'loading'}
			>
				<CircularProgress color="info" />
			</Backdrop>
			<Table aria-label="pipelines list">
				<TableHead>
					<TableRow>
						<TableCell component="th" />
						<TableCell component="th">Name</TableCell>
						<TableCell component="th">Status</TableCell>
						<TableCell component="th">Actions</TableCell>
					</TableRow>
				</TableHead>
				{pipelinesStatus === 'loaded' &&
					<TableBody>
						{
							pipelines.map((row) => {
								return (
									<Row
										key={row.id}
										row={row}
										pipelineStatus={getPipelineStatus(row.steps)} />
								)
							})
						}
					</TableBody>
				}
			</Table>
		</>
	)
}