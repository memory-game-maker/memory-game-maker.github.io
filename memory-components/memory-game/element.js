customElements.whenDefined("memory-game-tile-html").then(() => {
  customElements.whenDefined("memory-game-baseclass").then(() => {
    let BaseClass = customElements.get("memory-game-baseclass");
    customElements.define(
      "memory-game",
      class extends BaseClass {
        get board() {
          return this.shadowRoot.getElementById("board");
        }
        set columncount(value = 5) {
          this.$setCSSProperty("columncount", value);
        }
        set rowcount(value = 5) {
          this.$setCSSProperty("rowcount", value);
        }
        boardsize(totaltiles) {
          let columncount = Math.ceil(Math.sqrt(totaltiles));
          let rowcount = Math.ceil(totaltiles / columncount);
          this.columncount = columncount;
          this.rowcount = rowcount;
          return { columncount, rowcount };
        }

        async loadTiles() {
          this.loadEmojiTiles(this.$getURLParameter("set") || "unicode-fruits");
        }
        async loadEmojiTiles(name) {
          const /*function*/ setTiles = (str) => {
              let set = [...str].slice(0, 8);
              let allvalues = [...set, ...set];
              let tiles = this.shuffle(allvalues).map((emoji, index) =>
                this.$createElement({
                  tag: "memory-game-tile",
                  html: `<span class="emoji">${emoji}</span>`,
                  //id: `tile_${index}`,
                })
              );
              this.replaceTiles(tiles);
            };
          let filename = `/memory-sets/${name}.json`;
          console.log(filename);
          let file = await fetch(filename);
          if (file.status == 200) {
            let emojis = await file.json();
            setTiles(emojis.allunicodes);
          } else {
            setTiles("🐶🐱🐭🐼🐯🐹🐰🐻🐨🦁🐮🐷🐸🐵🐔🐘🐪🦒");
          }
        }
        replaceTiles(DOMElementsArray) {
          this.tiles = DOMElementsArray;
          this.innerHTML = ``;
          this.append(...this.tiles);
          this.boardsize(this.tiles.length);
        }

        $connectedComponent() {
          console.log(this.attributes);
          this.loadTiles();
        }
        $renderedComponent() {
          let eventbuttons = this.shadowRoot.querySelectorAll(`button[events]`);
          eventbuttons.forEach((button) => {
            console.log(666, eventbuttons, button.getAttribute("events"));
            this.$registerEventMethod({
              scope: button,
              methodName: button.getAttribute("events"),
            });
          });
        }

        shuffle(array) {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array;
        }

        $event_tile_clicked(evt) {
          this.consolelog("tile clicked", evt.detail);
        }
      }
    );
  });
});
