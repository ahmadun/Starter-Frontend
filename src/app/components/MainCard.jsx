import { Card, styled } from "@mui/material";

const CardRoot = styled(Card)({
  height: "100%",
  padding: "20px 20px"
});

const MainCard = ({ children }) => {
  return <CardRoot elevation={6}>{children}</CardRoot>;
};

export default MainCard;
