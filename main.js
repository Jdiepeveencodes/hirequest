class VillageScene extends Phaser.Scene {
    constructor() {
        super("VillageScene");
    }

    preload() {
        this.load.tilemapTiledJSON("village", "assets/maps/village_level1.json");

        this.load.image(
            "roguelikeSheet_transparent",
            "assets/tilesets/roguelikesheet_transparent.png"
        );

        this.load.spritesheet("player", "assets/sprites/player.png", {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        // --- MAP ---
        const map = this.make.tilemap({ key: "village" });
        const tileset = map.addTilesetImage(
            "roguelikeSheet_transparent",
            "roguelikeSheet_transparent"
        );

        map.createLayer("Ground", tileset, 0, 0);
        map.createLayer("Details", tileset, 0, 0);

        const collision = map.createLayer("Collision", tileset, 0, 0);
        collision.setCollisionByExclusion([-1]);

        // --- OBJECTS ---
        const objects = map.getObjectLayer("Objects").objects;

        const spawnObj = objects.find(o => o.name === "PlayerSpawn");
        const spawn = spawnObj ? { x: spawnObj.x, y: spawnObj.y - 8 } : { x: 200, y: 200 };

        // --- PLAYER ---
        this.player = this.physics.add.sprite(spawn.x, spawn.y, "player", 0);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, collision);

        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        this.player.play("walk");

        // --- INPUT ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.W = this.input.keyboard.addKey("W");
        this.A = this.input.keyboard.addKey("A");
        this.S = this.input.keyboard.addKey("S");
        this.D = this.input.keyboard.addKey("D");
        this.E = this.input.keyboard.addKey("E");

        // --- FLOATING PROMPT ---
        this.interactPrompt = this.add.text(0, 0, "Press E", {
            fontSize: "14px",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: { left: 6, right: 6, top: 4, bottom: 4 }
        })
            .setOrigin(0.5, 1)
            .setDepth(999)
            .setVisible(false);

        // --- DIALOG BOX ---
        this.dialogBoxBG = this.add.rectangle(400, 530, 760, 120, 0x000000, 0.7)
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);

        this.dialogText = this.add.text(50, 480, "", {
            fontSize: "20px",
            color: "#ffffff",
            wordWrap: { width: 700 }
        })
            .setScrollFactor(0)
            .setDepth(1001)
            .setVisible(false);

        this.dialogOpen = false;

        // --- CAMERA ---
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- RIDDLE PROGRESS ---
        this.riddle = { Bram: false, Mirel: false, Elara: false };

        // --- INTERACTION ZONES (Radius = 60px) ---
        const RADIUS = 60;
        this.interactables = {};

        const makeZone = (objName) => {
            const o = objects.find(ob => ob.name === objName);
            if (!o) return;

            const zone = this.add.zone(o.x, o.y - 8, RADIUS, RADIUS);
            this.physics.world.enable(zone);
            zone.body.setAllowGravity(false);
            zone.body.moves = false;

            this.interactables[objName] = { zone, x: o.x, y: o.y - 8 };
        };

        ["Bram", "Mirel", "Elara", "infoSign", "MagicDoor"].forEach(makeZone);

        this.activeTarget = null;
    }

    update() {
        if (this.dialogOpen) return;

        this.handleMovement();

        this.activeTarget = null;
        const px = this.player.x;
        const py = this.player.y;

        let nearest = null;
        let nearestDist = Infinity;
        const RADIUS = 60;

        for (const key in this.interactables) {
            const obj = this.interactables[key];
            const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);

            if (dist < RADIUS && dist < nearestDist) {
                nearest = key;
                nearestDist = dist;
            }
        }

        this.activeTarget = nearest;

        if (nearest) {
            const obj = this.interactables[nearest];

            this.interactPrompt.setVisible(true);
            this.interactPrompt.setPosition(obj.x, obj.y - 20);

            if (Phaser.Input.Keyboard.JustDown(this.E)) {
                this.handleInteraction(nearest);
            }
        } else {
            this.interactPrompt.setVisible(false);
        }
    }

    handleMovement() {
        const p = this.player;
        p.setVelocity(0);

        if (this.cursors.left.isDown || this.A.isDown) {
            p.setVelocityX(-120);
            p.setFlipX(true);
        } else if (this.cursors.right.isDown || this.D.isDown) {
            p.setVelocityX(120);
            p.setFlipX(false);
        }

        if (this.cursors.up.isDown || this.W.isDown) {
            p.setVelocityY(-120);
        } else if (this.cursors.down.isDown || this.S.isDown) {
            p.setVelocityY(120);
        }

        p.body.velocity.normalize().scale(120);
    }

    showDialog(text) {
        if (this.dialogOpen) return;

        this.dialogOpen = true;

        this.dialogText.setText(text);
        this.dialogText.setVisible(true);
        this.dialogBoxBG.setVisible(true);

        this.time.delayedCall(2000, () => this.closeDialog());
    }

    closeDialog() {
        this.dialogOpen = false;
        this.dialogText.setVisible(false);
        this.dialogBoxBG.setVisible(false);
    }

    handleInteraction(name) {
        switch (name) {
            case "infoSign":
                this.showDialog("Welcome!\nSeek Bram, Mirel, and Elara to gather the riddle.");
                break;

            case "Bram":
                this.riddle.Bram = true;
                this.showDialog("Bram:\n“The first part of the Riddle is: I grow each year, yet I can't be seen.”");
                break;

            case "Mirel":
                this.riddle.Mirel = true;
                this.showDialog("Mirel:\n“The second Riddle is: I open doors which no key can unlock.”");
                break;

            case "Elara":
                this.riddle.Elara = true;
                this.showDialog("Elara:\n“The third part of the Riddle is: You can't borrow me, but you earn me every day.”");
                break;

            case "MagicDoor":
                if (this.riddle.Bram && this.riddle.Mirel && this.riddle.Elara) {
                    this.showDialog("EXPERIENCE! You solved the riddle—the door opens.");
                } else {
                    this.showDialog("The door rejects you.\nYou must gather all 3 parts of the riddle first.");
                }
                break;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 750,
    height: 650,
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [VillageScene]
};

new Phaser.Game(config);
