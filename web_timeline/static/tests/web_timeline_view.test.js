import {animationFrame, expect, test} from "@odoo/hoot";
import {queryAll} from "@odoo/hoot-dom";
import {
    contains,
    defineModels,
    fields,
    models,
    mountView,
    onRpc,
    preloadBundle,
} from "@web/../tests/web_test_helpers";

class Partner extends models.Model {
    name = fields.Char();

    _records = [
        {id: 1, name: "Partner 1"},
        {id: 2, name: "Partner 2"},
        {id: 3, name: "Partner 3"},
    ];
}

class Order extends models.Model {
    name = fields.Char();
    date_start = fields.Date();
    date_end = fields.Date();
    partner_id = fields.Many2one({relation: "partner"});

    _records = [
        {
            id: 1,
            name: "Record 1",
            date_start: "2024-01-01",
            date_end: "2024-01-02",
            partner_id: 1,
        },
        {
            id: 2,
            name: "Record 2",
            date_start: "2024-01-03",
            date_end: "2024-02-05",
            partner_id: 1,
        },
        {
            id: 3,
            name: "Record 3",
            date_start: "2024-01-10",
            date_end: "2024-01-15",
            partner_id: 2,
        },
        {
            id: 4,
            name: "Record 4",
            date_start: "2024-01-15",
            date_end: "2024-02-01",
            partner_id: 3,
        },
    ];
}

defineModels([Partner, Order]);
preloadBundle("web_timeline.vis-timeline_lib");

const ARCH = `<timeline date_start="date_start" date_stop="date_end" default_group_by="partner_id"/>`;
const SCALE_BUTTONS = [
    ".oe_timeline_button_today",
    ".oe_timeline_button_scale_day",
    ".oe_timeline_button_scale_week",
    ".oe_timeline_button_scale_month",
    ".oe_timeline_button_scale_year",
];

function mountTimeline(arch = ARCH) {
    onRpc("has_access", () => true);
    return mountView({type: "timeline", resModel: "order", arch});
}

function expectOnlyActiveButton(activeSelector) {
    for (const selector of SCALE_BUTTONS) {
        if (selector === activeSelector) {
            expect(selector).toHaveClass("btn-primary");
        } else {
            expect(selector).not.toHaveClass("btn-primary");
        }
    }
}

function getItemContent(text) {
    const items = queryAll(".vis-item-content").filter((el) =>
        el.textContent.includes(text)
    );
    expect(items).toHaveLength(1);
    return items[0];
}

test("basic timeline view", async () => {
    await mountTimeline();
    expect(".oe_timeline_view").toHaveCount(1);
});

test("click today slot", async () => {
    await mountTimeline();
    await contains(".oe_timeline_button_today").click();
    expectOnlyActiveButton(".oe_timeline_button_today");
});

test("click month slot", async () => {
    await mountTimeline();
    await contains(".oe_timeline_button_scale_month").click();
    expectOnlyActiveButton(".oe_timeline_button_scale_month");
});

test("delete button is shown on the selected item", async () => {
    await mountTimeline();
    const itemContent = getItemContent("Record 2");
    await contains(itemContent).click();
    await animationFrame();
    expect(itemContent.closest(".vis-item")).toHaveClass("vis-selected");
    expect(itemContent.closest(".vis-item").querySelector(".vis-delete")).not.toBe(null);
});

test("delete button is hidden when delete is disabled", async () => {
    await mountTimeline(
        `<timeline date_start="date_start" date_stop="date_end" default_group_by="partner_id" delete="0"/>`
    );
    const itemContent = getItemContent("Record 2");
    await contains(itemContent).click();
    await animationFrame();
    expect(itemContent.closest(".vis-item")).toHaveClass("vis-selected");
    expect(itemContent.closest(".vis-item").querySelector(".vis-delete")).toBe(null);
});
