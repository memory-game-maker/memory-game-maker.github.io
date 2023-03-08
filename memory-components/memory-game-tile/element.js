customElements.whenDefined("memory-game-tile-html").then(() => {
  customElements.whenDefined("memory-game-baseclass").then(() => {
    let BaseClass = customElements.get("memory-game-baseclass");
    customElements.define(
      "memory-game-tile",
      class extends BaseClass {
        get debug() {
          return true;
        }
        $connectedComponent() {
          this._rotate = 180;
          // this.flip();
        }
        $attributeChanged_name(oldValue, newValue) {}
        $renderedComponent() {
          this.$listen({
            name: "closeall",
            eventbus: this.MemoryGameElement,
            handler: () => this.flip(),
          });
        }
        $styleLoaded(style) {
          this.$fitTextInContainer(
            this.$getLightDOM(".emoji"),
            this.$getPart("card")
          );
        }
        $event_click(evt) {
          this.flip();
          this.$emit("tile_clicked", { tile: this });
          //this.$emit("closeall", { tile: this });
        }
        $eventbus_closeall(evt) {
          this.flip();
        }
        $serverevent_reset() {
          this.back();
        }
        flip() {
          setTimeout(() => {
            this.classList.toggle("flipped");
            this.rotate += 180;
          });
        }
        back() {
          this.classList.remove("flipped");
          this.rotate = 0;
        }
        front() {
          this.classList.add("flipped");
          this.rotate = 180;
        }
        get rotate() {
          return this._rotate;
        }
        set rotate(value) {
          this.shadowRoot.getElementById(
            "rotate"
          ).innerHTML = `[part="card"]{transform:rotateY(${(this._rotate =
            value)}deg)}`;
        }
      }
    );
  });
});
