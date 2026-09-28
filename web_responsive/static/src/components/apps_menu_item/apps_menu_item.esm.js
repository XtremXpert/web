/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Component, t, useProps} from "@odoo/owl";
import {getWebIconData} from "@web_responsive/components/apps_menu_tools.esm";

export class AppMenuItem extends Component {
    static template = "web_responsive.AppMenuItem";
    props = useProps({
        app: t.object(),
        href: t.string(),
        currentApp: t.object().optional(),
        onClick: t.function(),
    });

    setup() {
        super.setup();
    }

    get isActive() {
        const {currentApp} = this.props;
        return currentApp && currentApp.id === this.props.app.id;
    }

    get className() {
        const classItems = ["o-app-menu-item"];
        if (this.isActive) {
            classItems.push("active");
        }
        return classItems.join(" ");
    }

    /** Owl 3: recomputed on each render, no onWillUpdateProps anymore */
    get webIconData() {
        return getWebIconData(this.props.app);
    }

    onClick() {
        if (typeof this.props.onClick === "function") {
            this.props.onClick(this.props.app);
        }
    }
}
