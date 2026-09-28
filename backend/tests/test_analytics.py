"""
Tests for pure-Python profit/expense arithmetic. Uses lightweight
in-memory objects rather than a live database, since the calculations
under test are plain arithmetic over already-fetched rows.
"""
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services import analytics_service


class FakeQuery:
    """Minimal stand-in for the small slice of the SQLAlchemy Query API
    analytics_service actually calls, so these tests don't need a real DB."""

    def __init__(self, rows):
        self._rows = rows

    def filter(self, *args, **kwargs):
        return self

    def group_by(self, *args, **kwargs):
        return self

    def all(self):
        return self._rows

    def scalar(self):
        return len(self._rows)


class FakeSession:
    def __init__(self, expense_rows=None, harvest_rows=None):
        self.expense_rows = expense_rows or []
        self.harvest_rows = harvest_rows or []

    def query(self, *entities):
        # expense_summary calls db.query(Expense.category, func.sum(Expense.amount))
        if len(entities) == 2:
            return FakeQuery(self.expense_rows)
        model = entities[0]
        if getattr(model, "__name__", "") == "Harvest":
            return FakeQuery(self.harvest_rows)
        return FakeQuery([])


def test_expense_summary_totals_by_category():
    seeds = SimpleNamespace(value="seeds")
    fertilizer = SimpleNamespace(value="fertilizer")
    session = FakeSession(expense_rows=[(seeds, Decimal("1000")), (fertilizer, Decimal("500"))])

    result = analytics_service.expense_summary(session, uuid4())

    assert result["total"] == 1500.0
    assert result["by_category"] == {"seeds": 1000.0, "fertilizer": 500.0}


def test_profit_summary_with_no_harvest_yet():
    session = FakeSession(expense_rows=[], harvest_rows=[])
    result = analytics_service.profit_summary(session, uuid4())
    assert result["total_revenue"] is None
    assert result["profit"] is None


def test_profit_summary_computes_roi_and_cost_per_unit():
    seeds = SimpleNamespace(value="seeds")
    session = FakeSession(
        expense_rows=[(seeds, Decimal("10000"))],
        harvest_rows=[SimpleNamespace(revenue=Decimal("15000"), yield_quantity=Decimal("50"))],
    )
    result = analytics_service.profit_summary(session, uuid4())
    assert result["total_expenses"] == 10000.0
    assert result["total_revenue"] == 15000.0
    assert result["profit"] == 5000.0
    assert result["roi_percentage"] == 50.0
    assert result["cost_per_unit_yield"] == 200.0
