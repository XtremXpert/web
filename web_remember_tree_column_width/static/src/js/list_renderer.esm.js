/** @odoo-module **/
/* Copyright 2020 Tecnativa - Alexandre Díaz
 * Copyright 2023 Tecnativa - Carlos Roca
 * Copyright 2024 Onestein - Anjeel Haria
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
 *
 * Portage Odoo 20 / Owl 3 : le hook useMagicColumnWidths d'Odoo 20 rend un
 * objet {resizing, onStartResize, resetWidths} et gère lui-même la fin du
 * redimensionnement. On l'enveloppe pour mémoriser la largeur choisie dans
 * localStorage et on réapplique les largeurs mémorisées après chaque rendu
 * (onMounted/onPatched enregistrés après ceux d'Odoo, donc exécutés après).
 */
import {onMounted, onPatched, useListener} from "@odoo/owl";
import {ListRenderer} from "@web/views/list/list_renderer";
import {browser} from "@web/core/browser/browser";
import {patch} from "@web/core/utils/patch";
import {useDebounced} from "@web/core/utils/timing";

const STORAGE_PREFIX = "odoo.columnWidth.";

patch(ListRenderer.prototype, {
    setup() {
        super.setup();
        if (!this.constructor.prototype.useMagicColumnWidths && !this.useMagicColumnWidths) {
            return;
        }
        const orig = this.columnWidths;
        const origStart = orig.onStartResize;
        this.columnWidths = {
            get resizing() {
                return orig.resizing;
            },
            resetWidths: () => {
                this._forgetStoredColumnWidths();
                orig.resetWidths();
            },
            onStartResize: (ev) => {
                const th = ev.target.closest("th");
                const res = origStart(ev);
                this._watchResizeEnd(th);
                return res;
            },
        };
        onMounted(() => this._applyStoredColumnWidths());
        onPatched(() => this._applyStoredColumnWidths());
        const debounced = useDebounced(() => this._applyStoredColumnWidths(), 300);
        useListener(window, "resize", debounced);
    },

    get _storedWidthsResModel() {
        return this.props.list && this.props.list.resModel;
    },

    _storageKey(fieldName) {
        return `${STORAGE_PREFIX}${this._storedWidthsResModel}.${fieldName}`;
    },

    /**
     * Après le redimensionnement (mêmes événements de fin que le hook d'Odoo),
     * mémorise la largeur de la colonne.
     */
    _watchResizeEnd(th) {
        if (!th || !browser.localStorage) {
            return;
        }
        const stopEvents = ["keydown", "pointerdown", "pointerup", "pointercancel"];
        const onStop = (ev) => {
            if (ev.type === "pointerdown" && ev.button === 0) {
                return;
            }
            for (const type of stopEvents) {
                window.removeEventListener(type, onStop);
            }
            const fieldName = th.dataset.name;
            const width = parseInt((th.style.width || "0").replace("px", ""), 10) || 0;
            if (fieldName && this._storedWidthsResModel && width) {
                browser.localStorage.setItem(this._storageKey(fieldName), width);
            }
        };
        for (const type of stopEvents) {
            window.addEventListener(type, onStop);
        }
    },

    _applyStoredColumnWidths() {
        const table = this.tableRef && this.tableRef();
        if (!table || !browser.localStorage || !this._storedWidthsResModel) {
            return;
        }
        for (const th of table.querySelectorAll("thead th[data-name]")) {
            const stored = browser.localStorage.getItem(this._storageKey(th.dataset.name));
            if (stored) {
                th.style.width = `${Math.floor(parseInt(stored, 10))}px`;
            }
        }
    },

    _forgetStoredColumnWidths() {
        const table = this.tableRef && this.tableRef();
        if (!table || !browser.localStorage || !this._storedWidthsResModel) {
            return;
        }
        for (const th of table.querySelectorAll("thead th[data-name]")) {
            browser.localStorage.removeItem(this._storageKey(th.dataset.name));
        }
    },
});
