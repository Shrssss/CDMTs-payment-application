export const Menu = (props) => {
  const {
    borderColor,
    backgroundColor,
    itemPrice,
    itemName,
    count,
    image,
    id,
    add,
    remove,
    difference,
    isDrinkScreen = false,
    isSoldout,
  } = props;

  // 無効条件
  const isRemoveDisabled = count <= 0;
  const isAddDisabled =
    isSoldout || (isDrinkScreen && difference <= 0) || count >= 9;

  const containerStyle = {
    ...itemStyle,
    border: isSoldout ? "2px solid #bbb" : borderColor,
    backgroundColor: isSoldout ? "#eee" : backgroundColor,
    position: "relative",
  };

  return (
    <div style={containerStyle}>
      {count > 0 && <div style={badgeStyle}>{count}</div>}
      <div style={imageBoxStyle}>
        {image ? (
          <img src={image} alt={itemName} style={imgTagStyle} />
        ) : (
          <div style={imagePlaceholderStyle} />
        )}

        {isSoldout && (
          <div style={soldoutOverlayStyle}>
            <span style={soldoutTextStyle}>SOLD OUT</span>
          </div>
        )}
      </div>
      <p
        style={{
          color: "red",
          margin: "8px 2px 2px 2px",
          fontWeight: "bold",
          fontSize: "20px",
        }}
      >
        {isSoldout ? "売り切れ" : itemPrice}
      </p>
      <p style={{ margin: "2px" }}>{itemName}</p>
      <div style={{ margin: "0px" }}>
        <div style={ButtonContainerStyle}>
          <button
            style={{
              ...buttonStyle,
              ...(isRemoveDisabled ? disabledBtnStyle : enabledBtnStyle),
            }}
            disabled={isRemoveDisabled}
            aria-disabled={isRemoveDisabled}
            onClick={(e) => {
              if (isRemoveDisabled) return;
              e.stopPropagation();
              remove(id);
            }}
          >
            ー
          </button>
          <button
            style={{
              ...buttonStyle,
              marginLeft: "8px",
              ...(isAddDisabled ? disabledBtnStyle : enabledBtnStyle),
            }}
            disabled={isAddDisabled}
            aria-disabled={isAddDisabled}
            onClick={(e) => {
              if (isAddDisabled) return;
              e.stopPropagation();
              add(id);
            }}
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  );
};

const judge = (difference, count) => {};

const itemStyle = {
  width: "40%",
  minHeight: "200px",
  padding: "8px",
  margin: "6px",
  borderRadius: "8px",
  position: "relative",
};

const imageBoxStyle = {
  width: "120px",
  height: "120px",
  marginTop: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: "#fff",
};

const imgTagStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

const imagePlaceholderStyle = {
  width: "100%",
  height: "100%",
};

const badgeStyle = {
  position: "absolute",
  top: "-12px",
  right: "-12px",
  backgroundColor: "#ff3300",
  color: "white",
  fontSize: "22px",
  fontWeight: "bold",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "3px solid #222",
};

const ButtonContainerStyle = {
  display: "flex",
  justifyContent: "center", // 横方向の中央寄せ
  margin: "10px 0 0px 0",
};

const buttonStyle = {
  width: "60px",
  height: "30px",
  padding: "0",
  fontSize: "18px",
  fontWeight: "bold",
  lineHeight: "1",
  borderRadius: "4px",
  border: "1px solid #ccc",
  marginBottom: "4px",
};

const enabledBtnStyle = {
  color: "#222",
  border: "1px solid #444",
};

const disabledBtnStyle = {
  backgroundColor: "#eee",
  color: "#999",
  borderColor: "#ddd",
  cursor: "not-allowed",
};

const soldoutOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const soldoutTextStyle = {
  color: "#fff",
  fontSize: "24px",
  fontWeight: "bold",
  textTransform: "uppercase",
};
