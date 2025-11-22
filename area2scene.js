window.Area2Scene = class Area2Scene extends Phaser.Scene {
    constructor() {
        super("Area2Scene");
    }

    preload() {
        this.load.tilemapTiledJSON("area2", "assets/maps/area2_level_v2.tmj");
        this.load.image("roguelikesheet_transparent", "assets/tilesets/roguelikesheet_transparent.png");

        this.load.spritesheet("player", "assets/sprites/player.png", {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        // MAP
        const map = this.make.tilemap({ key: "area2" });
        const tileset = map.addTilesetImage("roguelikesheet_transparent", "roguelikesheet_transparent");

        map.createLayer("Ground", tileset, 0, 0);
        const collision = map.createLayer("Collision", tileset, 0, 0);
        if (collision) collision.setCollisionByExclusion([-1]);

        // OBJECTS
        const objects = map.getObjectLayer("Objects")?.objects || [];

        // Player spawn
        const spawnObj = objects.find(o => o.name === "Area2Spawn");
        const spawn = spawnObj
            ? { x: spawnObj.x, y: spawnObj.y - 16 }
            : { x: 200, y: 200 };

        // PLAYER
        this.player = this.physics.add.sprite(spawn.x, spawn.y, "player");
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, collision);

        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        this.player.play("walk");

        // INPUT
        this.cursors = this.input.keyboard.createCursorKeys();
        this.W = this.input.keyboard.addKey("W");
        this.A = this.input.keyboard.addKey("A");
        this.S = this.input.keyboard.addKey("S");
        this.D = this.input.keyboard.addKey("D");
        this.E = this.input.keyboard.addKey("E");

        // CAMERA
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- FLOATING "Press E" PROMPT ---
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
        this.dialogBoxBG = this.add.rectangle(400, 530, 760, 120, 0x000000, 0.75)
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

        // --- INTERACTABLES ---
        const RADIUS = 60;
        this.interactables = {};

        const addZone = (name) => {
            const obj = objects.find(o => o.name === name);
            if (!obj) return;

            const zone = this.add.zone(obj.x, obj.y - 8, RADIUS, RADIUS);
            this.physics.world.enable(zone);
            zone.body.setAllowGravity(false);
            zone.body.moves = false;

            this.interactables[name] = { zone, x: obj.x, y: obj.y - 8 };
        };

        addZone("Chest");

        this.activeTarget = null;
    }

    update() {
        if (this.dialogOpen) return;

        this.handleMovement();
        this.checkInteractions();
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

    checkInteractions() {
        const px = this.player.x;
        const py = this.player.y;
        const RADIUS = 60;

        let nearest = null;
        let nearestDist = Infinity;

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

    // --- DIALOG SYSTEM ---
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
        if (name === "Chest") {
            this.showDialog(
                "📈 You gained experience!\n" +
                "💼 Let's talk about that offer!\n\n" +
                "Thank you for taking a look!"
            );
        }
    }
};
