class Area2Scene extends Phaser.Scene {
    constructor() {
        super("Area2Scene");
    }

    preload() {
        this.load.tilemapTiledJSON("area2", "assets/maps/area2_level.tmj");

        this.load.image(
            "roguelikesheet_transparent",
            "assets/tilesets/roguelikesheet_transparent.png"
        );

        this.load.spritesheet("player", "assets/sprites/player.png", {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        // --- MAP ---
        const map = this.make.tilemap({ key: "area2" });
        const tileset = map.addTilesetImage(
            "roguelikesheet_transparent",
            "roguelikesheet_transparent"
        );

        map.createLayer("Ground", tileset, 0, 0);
        const collision = map.createLayer("Collision", tileset, 0, 0);
        collision.setCollisionByExclusion([-1]);

        // --- OBJECTS ---
        const objects = map.getObjectLayer("Objects").objects;
        const spawnObj = objects.find(o => o.name === "Area2Spawn");

        const spawn = spawnObj
            ? { x: spawnObj.x, y: spawnObj.y - 8 }
            : { x: 200, y: 200 };

        // --- PLAYER ---
        this.player = this.physics.add.sprite(spawn.x, spawn.y, "player", 0);
        this.physics.add.collider(this.player, collision);

        // --- CAMERA ---
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // --- INPUT (reuse from VillageScene) ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.W = this.input.keyboard.addKey("W");
        this.A = this.input.keyboard.addKey("A");
        this.S = this.input.keyboard.addKey("S");
        this.D = this.input.keyboard.addKey("D");
    }

    update() {
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
}
