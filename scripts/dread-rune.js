/**
 * PF2E Property Runes - Dread Rune Automation
 * Automates the Dread Rune effect on armor for Pathfinder 2E
 */

class DreadRuneAutomation {
    constructor() {
        this.DREAD_RUNE_DISTANCE = 30; // 30 feet
        this.DREAD_RUNE_DC = 20; // DC 20 Will save
        this.DREAD_RUNE_NAME = "Dread Rune";
        this.DREAD_RUNE_EFFECT = "dread-rune-effect";
        
        this.initializeHooks();
        this.initializeSettings();
    }

    /**
     * Initialize FoundryVTT hooks for the module
     */
    initializeHooks() {
        // Hook into the end of turn to check for Dread Rune effects
        Hooks.on("pf2e.endTurn", this.onEndTurn.bind(this));
        
        // Hook into combat tracker updates to track turn changes
        Hooks.on("updateCombat", this.onCombatUpdate.bind(this));
        
        // Hook into actor updates to detect when Dread Rune is added/removed
        Hooks.on("updateActor", this.onActorUpdate.bind(this));
        
        // Module initialization
        Hooks.on("ready", this.onReady.bind(this));
    }

    /**
     * Initialize module settings
     */
    initializeSettings() {
        // Register module settings
        game.settings.register("pf2e-property-runes", "enable-dread-rune", {
            name: "Enable Dread Rune Automation",
            hint: "Automatically trigger Dread Rune effects when frightened enemies end their turn within range",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                this.log(`Dread Rune automation ${value ? 'enabled' : 'disabled'}`);
            }
        });

        game.settings.register("pf2e-property-runes", "dread-rune-dc", {
            name: "Dread Rune Save DC",
            hint: "The Will save DC for the Dread Rune effect",
            scope: "world",
            config: true,
            type: Number,
            default: 20,
            range: { min: 10, max: 50, step: 1 },
            onChange: (value) => {
                this.DREAD_RUNE_DC = value;
                this.log(`Dread Rune DC updated to ${value}`);
            }
        });

        game.settings.register("pf2e-property-runes", "dread-rune-range", {
            name: "Dread Rune Range (feet)",
            hint: "The range in feet for the Dread Rune effect",
            scope: "world",
            config: true,
            type: Number,
            default: 30,
            range: { min: 10, max: 100, step: 5 },
            onChange: (value) => {
                this.DREAD_RUNE_DISTANCE = value;
                this.log(`Dread Rune range updated to ${value} feet`);
            }
        });

        game.settings.register("pf2e-property-runes", "show-chat-messages", {
            name: "Show Chat Messages",
            hint: "Display chat messages when Dread Rune effects are triggered",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                this.log(`Chat messages ${value ? 'enabled' : 'disabled'}`);
            }
        });

        game.settings.register("pf2e-property-runes", "auto-roll-saves", {
            name: "Auto-roll Saves",
            hint: "Automatically roll Will saves for affected creatures",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                this.log(`Auto-roll saves ${value ? 'enabled' : 'disabled'}`);
            }
        });

        game.settings.register("pf2e-property-runes", "debug-mode", {
            name: "Debug Mode",
            hint: "Enable detailed console logging for troubleshooting",
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
            onChange: (value) => {
                this.log(`Debug mode ${value ? 'enabled' : 'disabled'}`);
            }
        });
    }

    /**
     * Log messages with debug mode support
     */
    log(message, data = null) {
        const debugMode = game.settings.get("pf2e-property-runes", "debug-mode");
        if (debugMode) {
            console.log(`[PF2E Property Runes] ${message}`, data);
        }
    }

    /**
     * Called when the module is ready
     */
    onReady() {
        this.log("Module initialization started");
        
        // Load settings
        this.DREAD_RUNE_DC = game.settings.get("pf2e-property-runes", "dread-rune-dc");
        this.DREAD_RUNE_DISTANCE = game.settings.get("pf2e-property-runes", "dread-rune-range");
        
        this.log("Settings loaded", {
            dc: this.DREAD_RUNE_DC,
            range: this.DREAD_RUNE_DISTANCE
        });
        
        this.setupDreadRuneEffect();
        this.log("Dread Rune automation loaded successfully");
        
        // Display welcome message
        if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
            this.showWelcomeMessage();
        }
    }

    /**
     * Show welcome message
     */
    async showWelcomeMessage() {
        const message = await ChatMessage.create({
            user: game.user.id,
            content: `<div class="dread-rune-effect">
                <div class="dread-rune-header">
                    <img src="icons/magic/symbols/runes-star-4-pentagon.webp" width="20" height="20">
                    <strong>PF2E Property Runes Module Loaded</strong>
                </div>
                <p>Dread Rune automation is now active! Check the module settings to configure options.</p>
            </div>`,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

    /**
     * Set up the Dread Rune effect in the system
     */
    setupDreadRuneEffect() {
        this.log("Setting up Dread Rune effect");
        
        // Register the Dread Rune effect if it doesn't exist
        if (!game.pf2e.effects.registered.has(this.DREAD_RUNE_EFFECT)) {
            const dreadRuneEffect = {
                id: this.DREAD_RUNE_EFFECT,
                name: this.DREAD_RUNE_NAME,
                description: "Eerie symbols cover your armor, inspiring terror in your foes. Frightened enemies within 30 feet that can see you must attempt a DC 20 Will save at the end of their turn; on a failure, the value of their frightened condition doesn't decrease below 1 that turn.",
                img: "icons/magic/symbols/runes-star-4-pentagon.webp",
                system: {
                    rules: [],
                    tokenIcon: {
                        show: true
                    },
                    level: {
                        value: 1
                    }
                }
            };
            
            // Add to the effects registry
            game.pf2e.effects.registered.set(this.DREAD_RUNE_EFFECT, dreadRuneEffect);
            this.log("Dread Rune effect registered successfully");
        } else {
            this.log("Dread Rune effect already registered");
        }
    }

    /**
     * Called when a turn ends in combat
     */
    async onEndTurn(combat, combatant) {
        if (!combat || !combatant || !combatant.actor) {
            this.log("End turn hook: Invalid combat or combatant", { combat, combatant });
            return;
        }
        
        const actor = combatant.actor;
        this.log(`End turn hook triggered for ${actor.name}`, { actorId: actor.id, actorType: actor.type });
        
        // Check if automation is enabled
        if (!game.settings.get("pf2e-property-runes", "enable-dread-rune")) {
            this.log("Dread Rune automation is disabled in settings");
            return;
        }
        
        // Check if this actor should be affected by Dread Rune
        if (this.shouldCheckDreadRune(actor)) {
            this.log(`${actor.name} meets Dread Rune conditions, processing effect`);
            await this.processDreadRuneEffect(actor);
        } else {
            this.log(`${actor.name} does not meet Dread Rune conditions`);
        }
    }

    /**
     * Called when combat updates
     */
    onCombatUpdate(combat, change, options, userId) {
        this.log("Combat update hook triggered", { change, options, userId });
        
        // This hook helps us track when turns change
        if (change.round !== undefined || change.turn !== undefined) {
            this.log("Combat round or turn changed", { round: change.round, turn: change.turn });
        }
    }

    /**
     * Called when an actor is updated
     */
    onActorUpdate(actor, change, options, userId) {
        this.log(`Actor update hook triggered for ${actor.name}`, { change, options, userId });
        
        // Check if Dread Rune effects were added or removed
        if (change.system?.traits?.value) {
            this.log("Actor traits changed, checking Dread Rune equipment");
            this.checkDreadRuneEquipment(actor);
        }
    }

    /**
     * Check if an actor should be affected by Dread Rune
     */
    shouldCheckDreadRune(actor) {
        this.log(`Checking if ${actor.name} should be affected by Dread Rune`);
        
        // Must be an enemy (not a PC or familiar)
        if (actor.type !== "npc" && actor.type !== "character") {
            this.log(`${actor.name} is not an enemy type (${actor.type})`);
            return false;
        }
        
        // Must have the frightened condition
        const frightenedEffect = actor.itemTypes.effect.find(effect => 
            effect.slug === "frightened"
        );
        
        if (!frightenedEffect) {
            this.log(`${actor.name} does not have frightened condition`);
            return false;
        }
        
        this.log(`${actor.name} has frightened condition with value ${frightenedEffect.system.value.value}`);
        
        // Must be within range of someone with Dread Rune armor
        const withinRange = this.isWithinDreadRuneRange(actor);
        this.log(`${actor.name} within Dread Rune range: ${withinRange}`);
        
        return withinRange;
    }

    /**
     * Check if an actor is within range of someone with Dread Rune armor
     */
    isWithinDreadRuneRange(actor) {
        const scene = game.scenes.active;
        if (!scene) {
            this.log("No active scene found");
            return false;
        }

        // Get all actors with Dread Rune armor in the scene
        const dreadRuneActors = this.getDreadRuneActors(scene);
        this.log(`Found ${dreadRuneActors.length} actors with Dread Rune armor`);
        
        for (const dreadRuneActor of dreadRuneActors) {
            const distance = this.getDistanceBetween(actor, dreadRuneActor);
            this.log(`Distance between ${actor.name} and ${dreadRuneActor.name}: ${distance.toFixed(1)} feet`);
            
            if (distance <= this.DREAD_RUNE_DISTANCE) {
                this.log(`${actor.name} is within range of ${dreadRuneActor.name}'s Dread Rune armor`);
                return true;
            }
        }
        
        this.log(`${actor.name} is not within range of any Dread Rune armor`);
        return false;
    }

    /**
     * Get all actors in the scene with Dread Rune armor
     */
    getDreadRuneActors(scene) {
        const dreadRuneActors = [];
        
        for (const token of scene.tokens) {
            if (token.actor && this.hasDreadRuneArmor(token.actor)) {
                dreadRuneActors.push(token.actor);
                this.log(`Found Dread Rune armor on ${token.actor.name}`);
            }
        }
        
        return dreadRuneActors;
    }

    /**
     * Check if an actor has Dread Rune armor equipped
     */
    hasDreadRuneArmor(actor) {
        // Check equipped armor for Dread Rune
        const equippedArmor = actor.itemTypes.armor.find(armor => 
            armor.isEquipped && 
            armor.system.runes?.property?.includes("dread")
        );
        
        if (equippedArmor) {
            this.log(`${actor.name} has Dread Rune armor: ${equippedArmor.name}`);
        }
        
        return !!equippedArmor;
    }

    /**
     * Calculate distance between two actors in feet
     */
    getDistanceBetween(actor1, actor2) {
        const scene = game.scenes.active;
        if (!scene) return Infinity;

        const token1 = scene.tokens.find(t => t.actor?.id === actor1.id);
        const token2 = scene.tokens.find(t => t.actor?.id === actor2.id);
        
        if (!token1 || !token2) return Infinity;

        // Get token positions
        const pos1 = token1.center;
        const pos2 = token2.center;
        
        // Calculate distance in grid units
        const distance = Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + 
            Math.pow(pos2.y - pos1.y, 2)
        );
        
        // Convert to feet (assuming 5-foot grid)
        const gridSize = scene.grid.size;
        const distanceInFeet = (distance / gridSize) * 5;
        
        this.log(`Grid distance: ${distance.toFixed(2)}, Grid size: ${gridSize}, Distance in feet: ${distanceInFeet.toFixed(1)}`);
        
        return distanceInFeet;
    }

    /**
     * Process the Dread Rune effect for a frightened enemy
     */
    async processDreadRuneEffect(actor) {
        this.log(`Processing Dread Rune effect for ${actor.name}`);
        
        try {
            if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
                // Create a chat message to announce the effect
                const message = await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: `<div class="dread-rune-effect">
                        <div class="dread-rune-header">
                            <img src="icons/magic/symbols/runes-star-4-pentagon.webp" width="20" height="20">
                            <strong>${this.DREAD_RUNE_NAME} Effect</strong>
                        </div>
                        <p><strong>${actor.name}</strong> is within range of Dread Rune armor and must attempt a Will save!</p>
                    </div>`,
                    type: CONST.CHAT_MESSAGE_TYPES.OTHER
                });
                this.log("Chat message created for Dread Rune effect");
            }

            // Force a Will save if auto-roll is enabled
            if (game.settings.get("pf2e-property-runes", "auto-roll-saves")) {
                this.log("Auto-roll enabled, forcing Will save");
                await this.forceWillSave(actor);
            } else {
                this.log("Auto-roll disabled, Will save must be rolled manually");
            }
            
        } catch (error) {
            console.error("Error processing Dread Rune effect:", error);
            this.log("Error processing Dread Rune effect", error);
        }
    }

    /**
     * Force a Will save for the affected actor
     */
    async forceWillSave(actor) {
        this.log(`Forcing Will save for ${actor.name} with DC ${this.DREAD_RUNE_DC}`);
        
        try {
            // Create a Will save check
            const willSave = new game.pf2e.Check({
                actor: actor,
                type: "saving-throw",
                skill: "will",
                dc: { value: this.DREAD_RUNE_DC },
                options: ["dread-rune", "property-rune"]
            });

            // Roll the save
            await willSave.roll();
            this.log(`Will save rolled for ${actor.name}, result: ${willSave.degreeOfSuccess}`);
            
            // Check the result and apply the effect
            if (willSave.degreeOfSuccess === "failure" || willSave.degreeOfSuccess === "criticalFailure") {
                this.log(`${actor.name} failed the Will save, applying Dread Rune failure effect`);
                await this.applyDreadRuneFailure(actor);
            } else {
                this.log(`${actor.name} succeeded on the Will save, no effect applied`);
            }
            
        } catch (error) {
            console.error("Error forcing Will save:", error);
            this.log("Error forcing Will save", error);
        }
    }

    /**
     * Apply the Dread Rune failure effect
     */
    async applyDreadRuneFailure(actor) {
        this.log(`Applying Dread Rune failure effect to ${actor.name}`);
        
        try {
            // Find the frightened effect
            const frightenedEffect = actor.itemTypes.effect.find(effect => 
                effect.slug === "frightened"
            );
            
            if (frightenedEffect) {
                // Get current frightened value
                const currentValue = frightenedEffect.system.value.value;
                this.log(`${actor.name} current frightened value: ${currentValue}`);
                
                // If it would decrease below 1, prevent it
                if (currentValue > 1) {
                    this.log(`Creating temporary effect to prevent frightened decrease below 1`);
                    
                    // Create a temporary effect to prevent the decrease
                    const preventDecreaseEffect = {
                        id: "dread-rune-prevent-decrease",
                        name: "Dread Rune - Prevent Frightened Decrease",
                        description: "The Dread Rune prevents your frightened condition from decreasing below 1 this turn.",
                        img: "icons/magic/symbols/runes-star-4-pentagon.webp",
                        system: {
                            rules: [],
                            tokenIcon: {
                                show: false
                            },
                            level: {
                                value: 1
                            },
                            duration: {
                                value: 1,
                                unit: "rounds"
                            }
                        }
                    };
                    
                    // Apply the effect
                    await actor.createEmbeddedDocuments("Item", [preventDecreaseEffect]);
                    this.log("Prevent decrease effect applied successfully");
                    
                    // Send a chat message about the effect if enabled
                    if (game.settings.get("pf2e-property-runes", "show-chat-messages")) {
                        await ChatMessage.create({
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker({ actor }),
                            content: `<div class="dread-rune-effect">
                                <div class="dread-rune-header">
                                    <img src="icons/magic/symbols/runes-star-4-pentagon.webp" width="20" height="20">
                                    <strong>${this.DREAD_RUNE_NAME} Effect</strong>
                                </div>
                                <p><strong>${actor.name}</strong> failed the Will save! Their frightened condition cannot decrease below 1 this turn.</p>
                            </div>`,
                            type: CONST.CHAT_MESSAGE_TYPES.OTHER
                        });
                    }
                } else {
                    this.log(`${actor.name} frightened value is already 1 or less, no effect needed`);
                }
            } else {
                this.log(`${actor.name} no longer has frightened effect`);
            }
            
        } catch (error) {
            console.error("Error applying Dread Rune failure effect:", error);
            this.log("Error applying Dread Rune failure effect", error);
        }
    }

    /**
     * Check for Dread Rune equipment when actors are updated
     */
    checkDreadRuneEquipment(actor) {
        this.log(`Checking Dread Rune equipment for ${actor.name}`);
        
        if (this.hasDreadRuneArmor(actor)) {
            this.log(`${actor.name} has Dread Rune armor equipped`);
        } else {
            this.log(`${actor.name} does not have Dread Rune armor equipped`);
        }
    }
}

// Initialize the module when FoundryVTT is ready
Hooks.on("ready", () => {
    new DreadRuneAutomation();
});
