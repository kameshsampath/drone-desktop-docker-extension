import { Checkbox, TableCell, TableHead, TableRow } from '@mui/material';

export const PipelinesTableHead = (props) => {
  const { onSelectAllClick, numSelected, rowCount } = props;
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            inputProps={{
              'aria-label': 'select all pipelines'
            }}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        <TableCell component="th" />
        <TableCell component="th">Name</TableCell>
        <TableCell component="th">Status</TableCell>
        <TableCell component="th">Actions</TableCell>
      </TableRow>
    </TableHead>
  );
};
