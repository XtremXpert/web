/** @odoo-module **/
// Portage Odoo 20 / Owl 3 :
// - Dialog expose déjà un signal `dialogSize` et une taille native "fs"
//   (pleine largeur), on s'appuie dessus au lieu d'écrire dans `this.props`.
// - `Dialog.props` n'existe plus (props = useProps(schéma)) : plus de
//   surcharge de validation ni de taille maison `dialog_full_screen`.
import {Component, t, useProps} from "@odoo/owl";
import {ActionDialog} from "@web/webclient/actions/action_dialog";
import {Dialog} from "@web/core/dialog/dialog";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";
import {browser} from "@web/core/browser/browser";

export const MAXIMIZED_SIZE = "fs";
const STORAGE_KEY = "odoo.web_dialog_size.value";
const SERVER_KEY = "odoo.web_dialog_size.last_server_value";

export class ExpandButton extends Component {
    static template = "web_dialog_size.ExpandButton";
    static propsSchema = {
        getsize: t.function(),
        setsize: t.function(),
        getoriginalsize: t.function().optional(),
    };
    props = useProps(this.constructor.propsSchema);

    setup() {
        this.original_size = this.props.getoriginalsize
            ? this.props.getoriginalsize()
            : this.props.getsize() !== MAXIMIZED_SIZE
              ? this.props.getsize()
              : "md";
    }

    get isMaximized() {
        return this.props.getsize() === MAXIMIZED_SIZE;
    }

    dialog_button_extend() {
        this.props.setsize(MAXIMIZED_SIZE);
        browser.localStorage.setItem(STORAGE_KEY, "true");
    }

    dialog_button_restore() {
        this.props.setsize(this.original_size);
        browser.localStorage.setItem(STORAGE_KEY, "false");
    }
}

patch(Dialog.prototype, {
    setup() {
        super.setup();
        this.originalSize = this.props.size;
        this.setSize = this.setSize.bind(this);
        this.getSize = this.getSize.bind(this);
        this.getOriginalSize = this.getOriginalSize.bind(this);

        const storedValue = browser.localStorage.getItem(STORAGE_KEY);
        const lastServerValue = browser.localStorage.getItem(SERVER_KEY);

        if (storedValue === "true") {
            this.setSize(MAXIMIZED_SIZE);
        }

        const orm = useService("orm");
        orm.call("ir.config_parameter", "get_web_dialog_size_config").then((r) => {
            const serverValue = String(Boolean(r.default_maximize));
            if (serverValue !== lastServerValue) {
                browser.localStorage.setItem(SERVER_KEY, serverValue);
                if (storedValue === null || storedValue === lastServerValue) {
                    browser.localStorage.setItem(STORAGE_KEY, serverValue);
                    if (serverValue === "true") {
                        this.setSize(MAXIMIZED_SIZE);
                    } else if (this.getSize() === MAXIMIZED_SIZE) {
                        this.setSize(this.getOriginalSize());
                    }
                }
            }
        });
    },

    setSize(size) {
        // Signal natif d'Odoo 20 : le rendu suit automatiquement.
        this.dialogSize.set(size);
    },

    getSize() {
        return this.size;
    },

    getOriginalSize() {
        return this.originalSize || "md";
    },
});

// ActionDialog copie Dialog.components à l'import : compléter les deux.
Dialog.components = Object.assign(Dialog.components || {}, {ExpandButton});
ActionDialog.components = Object.assign(ActionDialog.components || {}, {ExpandButton});
