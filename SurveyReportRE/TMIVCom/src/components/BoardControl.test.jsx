import React, { createRef } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BoardControl from "./BoardControl.jsx";

const lanes = [
    { value: "todo", text: "To do", color: "#64748b" },
    { value: "doing", text: "In progress", color: "#3b82f6" },
    { value: "done", text: "Done", color: "#10b981" }
];

const items = [
    { id: 1, status: "todo", title: "Build quote flow", assignee: "Alex Tran", priority: "High" },
    { id: 2, status: "doing", title: "Review policy", assignee: "Minh Le", priority: "Medium" }
];

describe("BoardControl", () => {
    it("derives lanes from a dxDataGrid status lookup and filters cards", async () => {
        render(
            <BoardControl
                dataSource={items}
                columns={[{
                    dataField: "status",
                    lookup: { dataSource: lanes, valueExpr: "value", displayExpr: "text" }
                }]}
            />
        );

        expect(await screen.findByRole("heading", { name: "To do" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "In progress" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();
        expect(screen.getByText("Build quote flow")).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Search cards..."), { target: { value: "policy" } });
        expect(screen.queryByText("Build quote flow")).not.toBeInTheDocument();
        expect(screen.getByText("Review policy")).toBeInTheDocument();
    });

    it("loads a grid store and persists a card move", async () => {
        const update = vi.fn().mockResolvedValue(undefined);
        const onCardMoved = vi.fn();
        const ref = createRef();
        const store = {
            key: "id",
            load: vi.fn().mockResolvedValue({ data: items, totalCount: items.length }),
            update
        };

        render(
            <BoardControl
                ref={ref}
                dataSource={store}
                laneDataSource={lanes}
                onCardMoved={onCardMoved}
            />
        );

        const cardTitle = await screen.findByText("Build quote flow");
        const card = cardTitle.closest(".tmiv-board-card");
        const doneColumn = screen.getByRole("heading", { name: "Done" }).closest(".tmiv-board-column");
        const dataTransfer = { effectAllowed: "", setData: vi.fn() };

        fireEvent.dragStart(card, { dataTransfer });
        fireEvent.dragOver(doneColumn, { dataTransfer });
        fireEvent.drop(doneColumn, { dataTransfer });

        await waitFor(() => expect(update).toHaveBeenCalledWith(1, { status: "done" }));
        await waitFor(() => expect(onCardMoved).toHaveBeenCalledWith(expect.objectContaining({
            key: 1,
            fromStatus: "todo",
            toStatus: "done"
        })));

        const doneBody = doneColumn.querySelector(".tmiv-board-column-body");
        expect(within(doneBody).getByText("Build quote flow")).toBeInTheDocument();
        expect(ref.current.getDataSource().find(item => item.id === 1).status).toBe("done");

        await act(async () => { await ref.current.reload(); });
        expect(store.load).toHaveBeenCalled();
    });
});
