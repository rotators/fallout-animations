import * as React from "react";
import * as ReactDOM from "react-dom";
import { Main } from "./ui/main";

export class UI {
    static init() {
        ReactDOM.render(React.createElement(Main), document.getElementById('react'));
    }
}