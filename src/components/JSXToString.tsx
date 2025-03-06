import { renderToStaticMarkup } from "react-dom/server";

export default function jsxToString(reactComponent: JSX.Element) {
  const htmlString = renderToStaticMarkup(reactComponent);
  return htmlString;
}