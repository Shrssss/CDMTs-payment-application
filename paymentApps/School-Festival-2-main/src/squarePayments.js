export async function loadSquareSdk(env = "PRODUCTION") {
  const SRC =
    env === "SANDBOX"
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";

  if (window.Square) {
    console.log("[square] SDK already present");
    return;
  }

  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => {
      console.log("[square] SDK loaded:", SRC);
      resolve();
    };
    s.onerror = () => {
      reject(new Error("square.js のロードに失敗: " + SRC));
    };
    document.head.appendChild(s);
  });
}
