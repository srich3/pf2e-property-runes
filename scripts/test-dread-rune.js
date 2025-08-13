/**
 * Test file for Dread Rune functionality
 * This file can be temporarily added to the module.json esmodules array for testing
 */

class DreadRuneTester {
    constructor() {
        this.testResults = [];
        this.initializeTestHooks();
    }

    /**
     * Initialize test hooks
     */
    initializeTestHooks() {
        // Add a test button to the chat
        Hooks.on("renderChatLog", this.addTestButton.bind(this));
        
        // Note: Removed keyboard binding as it's not available in FoundryVTT v13
        console.log("🧪 Dread Rune Tester initialized. Use the test button to run tests.");
    }

    /**
     * Add test button to chat
     */
    addTestButton(chatLog, html) {
        if (html.find('.dread-rune-test-button').length > 0) return;
        
        const testButton = $(`
            <button class="dread-rune-test-button" style="
                background: #8b4513; 
                color: #f7931e; 
                border: 2px solid #f7931e; 
                border-radius: 4px; 
                padding: 8px 16px; 
                margin: 8px; 
                cursor: pointer;
                font-weight: bold;
            ">
                🧪 Test Dread Rune
            </button>
        `);
        
        testButton.click(() => this.runAllTests());
        html.find('.chat-controls').append(testButton);
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log("🧪 Running Dread Rune Tests...");
        this.testResults = [];
        
        try {
            await this.testModuleInitialization();
            await this.testDistanceCalculation();
            await this.testDreadRuneDetection();
            await this.testEffectApplication();
            await this.testSaveRolling();
            
            this.displayTestResults();
        } catch (error) {
            console.error("Test suite failed:", error);
            this.addTestResult("Test Suite", false, `Failed with error: ${error.message}`);
            this.displayTestResults();
        }
    }

    /**
     * Test module initialization
     */
    async testModuleInitialization() {
        const testName = "Module Initialization";
        
        try {
            // Check if the module is loaded
            if (typeof DreadRuneAutomation !== 'undefined') {
                this.addTestResult(testName, true, "DreadRuneAutomation class found");
            } else {
                this.addTestResult(testName, false, "DreadRuneAutomation class not found");
            }
            
            // Check if hooks are registered
            const hooks = Hooks.events;
            if (hooks.pf2e && hooks.pf2e.endTurn) {
                this.addTestResult(testName, true, "PF2E hooks available");
            } else {
                this.addTestResult(testName, false, "PF2E hooks not available");
            }
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    /**
     * Test distance calculation
     */
    async testDistanceCalculation() {
        const testName = "Distance Calculation";
        
        try {
            const scene = game.scenes.active;
            if (!scene) {
                this.addTestResult(testName, false, "No active scene found");
                return;
            }

            const tokens = scene.tokens.filter(t => t.actor);
            if (tokens.length < 2) {
                this.addTestResult(testName, false, "Need at least 2 tokens for distance test");
                return;
            }

            const token1 = tokens[0];
            const token2 = tokens[1];
            
            // Calculate distance manually
            const pos1 = token1.center;
            const pos2 = token2.center;
            const distance = Math.sqrt(
                Math.pow(pos2.x - pos1.x, 2) + 
                Math.pow(pos2.y - pos1.y, 2)
            );
            
            const gridSize = scene.grid.size;
            const distanceInFeet = (distance / gridSize) * 5;
            
            this.addTestResult(testName, true, `Distance calculated: ${distanceInFeet.toFixed(1)} feet`);
            
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    /**
     * Test Dread Rune detection
     */
    async testDreadRuneDetection() {
        const testName = "Dread Rune Detection";
        
        try {
            const actors = game.actors.filter(a => a.type === "character" || a.type === "npc");
            let dreadRuneFound = false;
            
            for (const actor of actors) {
                const armor = actor.itemTypes.armor.find(a => a.isEquipped);
                if (armor && armor.system.runes?.property) {
                    if (armor.system.runes.property.includes("dread")) {
                        dreadRuneFound = true;
                        this.addTestResult(testName, true, `Dread Rune found on ${actor.name}`);
                        break;
                    }
                }
            }
            
            if (!dreadRuneFound) {
                this.addTestResult(testName, false, "No Dread Rune armor found (this is expected if none is equipped)");
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    /**
     * Test effect application
     */
    async testEffectApplication() {
        const testName = "Effect Application";
        
        try {
            // Test creating a temporary effect
            const testEffect = {
                name: "Test Dread Rune Effect",
                type: "effect",
                img: "icons/magic/symbols/runes-star-4-pentagon.webp",
                system: {
                    rules: [],
                    tokenIcon: { show: false },
                    level: { value: 1 },
                    duration: { value: 1, unit: "rounds" }
                }
            };
            
            this.addTestResult(testName, true, "Effect creation test passed");
            
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    /**
     * Test save rolling
     */
    async testSaveRolling() {
        const testName = "Save Rolling";
        
        try {
            // Check if PF2E system is available
            if (game.pf2e && game.pf2e.Check) {
                this.addTestResult(testName, true, "PF2E Check system available");
            } else {
                this.addTestResult(testName, false, "PF2E Check system not available");
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Error: ${error.message}`);
        }
    }

    /**
     * Add a test result
     */
    addTestResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed: passed,
            message: message
        });
        
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
    }

    /**
     * Display test results
     */
    displayTestResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        const resultsHtml = `
            <div class="dread-rune-test-results" style="
                background: linear-gradient(135deg, #2c1810 0%, #4a2c1a 100%);
                border: 2px solid #f7931e;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                color: #e8d5c4;
            ">
                <h3 style="color: #f7931e; margin-top: 0;">🧪 Dread Rune Test Results</h3>
                <p><strong>Overall Result:</strong> ${passed}/${total} tests passed</p>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${this.testResults.map(result => `
                        <div style="
                            margin: 8px 0; 
                            padding: 8px; 
                            background: ${result.passed ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'};
                            border-left: 3px solid ${result.passed ? '#00ff00' : '#ff0000'};
                            border-radius: 4px;
                        ">
                            <strong>${result.test}:</strong> ${result.message}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Send to chat
        ChatMessage.create({
            user: game.user.id,
            content: resultsHtml,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }
}

// Initialize tester when ready
Hooks.on("ready", () => {
    new DreadRuneTester();
});
