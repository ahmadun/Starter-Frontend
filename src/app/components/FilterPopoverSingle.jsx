import React from 'react';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Box } from '@mui/material';
import { FilterListOffOutlined } from '@mui/icons-material';

const StatusItem = ({ status, setColumnFilters, isActive, column, option_name }) => (
    <ListItem
        style={{
            fontWeight: 'bold',
            backgroundColor: isActive ? '#cfe0c3' : 'transparent'
        }}
        onClick={() => {
            setColumnFilters((prev) => {
                const statuses = prev?.find((filter) => filter.id === column)?.value;
                if (!statuses) {
                    return prev.concat({
                        id: column,
                        value: [status.id]
                    });
                }

                return prev.map((f) =>
                    f.id === column
                        ? {
                            ...f,
                            value: isActive
                                ? statuses.filter((s) => s !== status.id)
                                : statuses.concat(status.id)
                        }
                        : f
                );
            });
        }}
    >
        <Typography>{status[option_name]}</Typography>
    </ListItem>
);

const FilterPopoverSingle = ({
    columnFilters,
    setColumnFilters,
    column,
    filterdata,
    option_name,
    label_name
}) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const filterStatuses = columnFilters?.find((f) => f?.id === column)?.value || [];

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Button
                size="small"
                startIcon={filterStatuses.length > 0 ? <FilterListOffOutlined /> : <FilterListIcon />}
                onClick={handleOpen}
            >
                {label_name}
            </Button>
            <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClose} sx={{ mt: 4 }}>
                <Box sx={{ p: 1 }}>
                    <List dense sx={{ cursor: 'pointer' }}>
                        {filterdata?.map((status) => (
                            <StatusItem
                                status={status}
                                isActive={filterStatuses?.includes(status.id)}
                                setColumnFilters={setColumnFilters}
                                key={status.id}
                                column={column}
                                option_name={option_name}
                            />
                        ))}
                    </List>
                </Box>
            </Popover>
        </div>
    );
};

export default FilterPopoverSingle;
