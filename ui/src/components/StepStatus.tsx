import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RunCircleIcon from '@mui/icons-material/RunCircle';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

export const StepStatus = (props: { status: string }) => {
	const { status } = props

	switch (status) {
		case "start":
			return (<RunCircleIcon color='warning' />)
		case "error":
			return (<ErrorIcon color='error' />)
		case "done":
			return (<CheckCircleIcon color='success' />)
		default:
			return (<QuestionMarkIcon color='action' />);
	}
}