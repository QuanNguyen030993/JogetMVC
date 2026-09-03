import React, { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TagBox from "./TagBox.jsx";

const departments = [
    { id: "FO", name: "Front Office" },
    { id: "UW", name: "Underwriting" },
    { id: "PM", name: "Policy Management" }
];

describe("TagBox", () => {
    it("selects, searches and removes multiple values", () => {
        const onValueChanged = vi.fn();
        render(
            <TagBox
                dataSource={departments}
                valueExpr="id"
                displayExpr="name"
                onValueChanged={onValueChanged}
            />
        );

        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.click(screen.getByRole("option", { name: "Front Office" }));
        expect(screen.getByText("Front Office")).toBeInTheDocument();
        expect(onValueChanged.mock.calls.at(-1)[0].value).toEqual(["FO"]);

        fireEvent.change(screen.getByRole("textbox"), { target: { value: "under" } });
        expect(screen.getByRole("option", { name: "Underwriting" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: "Policy Management" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Remove Front Office"));
        expect(onValueChanged.mock.calls.at(-1)[0].value).toEqual([]);
    });

    it("supports DevExtreme-like imperative options", () => {
        const ref = createRef();
        render(<TagBox ref={ref} dataSource={departments} />);

        act(() => ref.current.option("value", ["UW", "PM"]));
        expect(ref.current.value()).toEqual(["UW", "PM"]);
        expect(screen.getByText("Underwriting")).toBeInTheDocument();
        expect(screen.getByText("Policy Management")).toBeInTheDocument();

        act(() => ref.current.option("disabled", true));
        expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
    });
});
