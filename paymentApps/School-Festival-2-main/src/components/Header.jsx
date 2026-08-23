import logoImg from "../image/logo.jpg";

export const Header = () => {
  return (
    <div style={headerStyle}>
      <img src={logoImg} style={logoStyle} />
    </div>
  );
};

headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#7fbfff",
  width: "100%",
  minHeight: "60px",
  padding: "0px",
  margin: "0px",
};

logoStyle = {
  width: "40%",
  height: "auto",
  borderRadius: "2px",
};
