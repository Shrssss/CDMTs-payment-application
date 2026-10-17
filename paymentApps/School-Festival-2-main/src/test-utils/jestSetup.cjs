// jsdom には TextEncoder/TextDecoder が無く、react-router の読み込み時に参照されるため Node の実装を入れる。
const { TextEncoder, TextDecoder } = require("util");

if (typeof globalThis.TextEncoder === "undefined") globalThis.TextEncoder = TextEncoder;
if (typeof globalThis.TextDecoder === "undefined") globalThis.TextDecoder = TextDecoder;
