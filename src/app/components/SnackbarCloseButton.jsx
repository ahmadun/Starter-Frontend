import { useSnackbar } from "notistack";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

export default function SnackbarCloseButton({ snackbarKey }) {
    const { closeSnackbar } = useSnackbar();

    return (
        <IconButton
            size="small"
            onClick={() => closeSnackbar(snackbarKey)}
            sx={{ color: "inherit", opacity: 0.7, "&:hover": { opacity: 1 } }}
        >
            <CloseIcon fontSize="small" />
        </IconButton>
    );
}