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
     * Called when the module is ready
     */
    onReady() {
        console.log("PF2E Property Runes: Dread Rune automation loaded");
        this.setupDreadRuneEffect();
    }

    /**
     * Set up the Dread Rune effect in the system
     */
    setupDreadRuneEffect() {
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
        }
    }

    /**
     * Called when a turn ends in combat
     */
    async onEndTurn(combat, combatant) {
        if (!combat || !combatant || !combatant.actor) return;
        
        const actor = combatant.actor;
        
        // Check if this actor is an enemy and has the frightened condition
        if (this.shouldCheckDreadRune(actor)) {
            await this.processDreadRuneEffect(actor);
        }
    }

    /**
     * Called when combat updates
     */
    onCombatUpdate(combat, change, options, userId) {
        // This hook helps us track when turns change
        if (change.round !== undefined || change.turn !== undefined) {
            // Combat round or turn changed, we'll let the endTurn hook handle the logic
        }
    }

    /**
     * Called when an actor is updated
     */
    onActorUpdate(actor, change, options, userId) {
        // Check if Dread Rune effects were added or removed
        if (change.system?.traits?.value) {
            this.checkDreadRuneEquipment(actor);
        }
    }

    /**
     * Check if an actor should be affected by Dread Rune
     */
    shouldCheckDreadRune(actor) {
        // Must be an enemy (not a PC or familiar)
        if (actor.type !== "npc" && actor.type !== "character") return false;
        
        // Must have the frightened condition
        const frightenedEffect = actor.itemTypes.effect.find(effect => 
            effect.slug === "frightened"
        );
        
        if (!frightenedEffect) return false;
        
        // Must be within 30 feet of someone with Dread Rune armor
        return this.isWithinDreadRuneRange(actor);
    }

    /**
     * Check if an actor is within 30 feet of someone with Dread Rune armor
     */
    isWithinDreadRuneRange(actor) {
        const scene = game.scenes.active;
        if (!scene) return false;

        // Get all actors with Dread Rune armor in the scene
        const dreadRuneActors = this.getDreadRuneActors(scene);
        
        for (const dreadRuneActor of dreadRuneActors) {
            const distance = this.getDistanceBetween(actor, dreadRuneActor);
            if (distance <= this.DREAD_RUNE_DISTANCE) {
                return true;
            }
        }
        
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
        return (distance / gridSize) * 5;
    }

    /**
     * Process the Dread Rune effect for a frightened enemy
     */
    async processDreadRuneEffect(actor) {
        try {
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

            // Force a Will save
            await this.forceWillSave(actor);
            
        } catch (error) {
            console.error("Error processing Dread Rune effect:", error);
        }
    }

    /**
     * Force a Will save for the affected actor
     */
    async forceWillSave(actor) {
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
            
            // Check the result and apply the effect
            if (willSave.degreeOfSuccess === "failure" || willSave.degreeOfSuccess === "criticalFailure") {
                await this.applyDreadRuneFailure(actor);
            }
            
        } catch (error) {
            console.error("Error forcing Will save:", error);
        }
    }

    /**
     * Apply the Dread Rune failure effect
     */
    async applyDreadRuneFailure(actor) {
        try {
            // Find the frightened effect
            const frightenedEffect = actor.itemTypes.effect.find(effect => 
                effect.slug === "frightened"
            );
            
            if (frightenedEffect) {
                // Get current frightened value
                const currentValue = frightenedEffect.system.value.value;
                
                // If it would decrease below 1, prevent it
                if (currentValue > 1) {
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
                    
                    // Send a chat message about the effect
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
            }
            
        } catch (error) {
            console.error("Error applying Dread Rune failure effect:", error);
        }
    }

    /**
     * Check for Dread Rune equipment when actors are updated
     */
    checkDreadRuneEquipment(actor) {
        // This method can be expanded to detect when Dread Rune armor is equipped/unequipped
        // and automatically apply/remove the effect
    }
}

// Initialize the module when FoundryVTT is ready
Hooks.on("ready", () => {
    new DreadRuneAutomation();
});
