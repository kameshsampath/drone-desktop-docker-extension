import { IconButton, Tooltip } from "@mui/material"
import { vscodeURI } from '../utils'

export const EditInVSCode = (props: { workspacePath: string }) => {
	const { workspacePath } = props
	return (
		<Tooltip title="Open in VS Code">
			<IconButton
				aria-label="edit in vscode"
				color="primary"
				href={vscodeURI(workspacePath)}>
				<img src="/images/vscode.png" width="24" />
			</IconButton>
		</Tooltip>
	)
}