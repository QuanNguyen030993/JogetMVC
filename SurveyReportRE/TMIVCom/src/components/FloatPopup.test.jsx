import React, { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FloatPopup from "./FloatPopup.jsx";

describe("FloatPopup", () => {
    it("supports the DevExtreme-like imperative visibility API", async () => {
        const ref = createRef();
        const onShowing = vi.fn();
        const onShown = vi.fn();
        const onHiding = vi.fn();

        render(
            <FloatPopup
                ref={ref}
                title="Customer details"
                animationDuration={0}
                showCloseButton
                onShowing={onShowing}
                onShown={onShown}
                onHiding={onHiding}
            >
                <p>Popup body</p>
            </FloatPopup>
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        await act(async () => { await ref.current.show(); });
        expect(screen.getByRole("dialog", { name: "Customer details" })).toBeInTheDocument();
        expect(screen.getByText("Popup body")).toBeInTheDocument();
        expect(onShowing).toHaveBeenCalledTimes(1);
        expect(onShown).toHaveBeenCalledTimes(1);

        await act(async () => { await ref.current.hide(); });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(onHiding).toHaveBeenCalledTimes(1);
    });

    it("reads and writes options and can cancel hiding", async () => {
        const ref = createRef();
        const onOptionChanged = vi.fn();
        const onHiding = vi.fn((event) => { event.cancel = true; });
        render(
            <FloatPopup
                ref={ref}
                visible
                title="Original"
                animationDuration={0}
                onHiding={onHiding}
                onOptionChanged={onOptionChanged}
            />
        );

        act(() => { ref.current.option("title", "Updated"); });
        expect(screen.getByText("Updated")).toBeInTheDocument();
        expect(ref.current.option("title")).toBe("Updated");
        expect(onOptionChanged).toHaveBeenCalledWith(expect.objectContaining({
            name: "title",
            value: "Updated",
            previousValue: "Original"
        }));

        await act(async () => { await ref.current.hide(); });
        expect(screen.getByRole("dialog", { name: "Updated" })).toBeInTheDocument();
    });

    it("closes from the backdrop, Escape, close button and toolbar actions", async () => {
        const ref = createRef();
        const save = vi.fn();
        render(
            <FloatPopup
                ref={ref}
                visible
                title="Actions"
                animationDuration={0}
                showCloseButton
                hideOnOutsideClick
                toolbarItems={[{
                    toolbar: "bottom",
                    location: "after",
                    options: { text: "Save", onClick: save }
                }]}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(save).toHaveBeenCalledTimes(1);

        fireEvent.mouseDown(document.querySelector(".tmivcom-floatpopup-wrapper"));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        await act(async () => { await ref.current.show(); });
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        await act(async () => { await ref.current.show(); });
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
