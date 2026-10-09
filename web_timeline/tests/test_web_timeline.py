# Copyright 2024 Tecnativa - Carlos Lopez
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from odoo.tests import tagged

from odoo.addons.web.tests.test_js import HootCommon, unit_test_error_checker


@tagged("post_install", "-at_install")
class TestWebTimeline(HootCommon):
    def test_timeline_hoot(self):
        """Run the web_timeline Hoot unit tests (arch parser and view).

        Odoo 20 removed the legacy QUnit runner (/web/tests/legacy): the
        JS tests are Hoot tests in web.assets_unit_tests, selected here by
        the hash of their "@web_timeline" suite.
        """
        suite_id = self._generate_hash("@web_timeline")
        self.browser_js(
            f"/web/tests?headless&loglevel=2&preset=desktop&timeout=15000&id={suite_id}",
            "",
            "",
            login="admin",
            timeout=1800,
            success_signal="[HOOT] Test suite succeeded",
            error_checker=unit_test_error_checker,
        )
