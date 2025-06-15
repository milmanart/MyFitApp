# Meal Type Assignment Logic

## How the Dynamic Meal Assignment Works

The app automatically assigns meal types based on **time grouping** and **chronological order** of entries for each day.

### Core Rules:

1. **30-Minute Window Rule**: Entries within 30 minutes of each other are grouped into the same meal
2. **Meal Group Assignment**:
   - **1 group** = Breakfast
   - **2 groups** = Breakfast + Dinner
   - **3 groups** = Breakfast + Lunch + Dinner  
   - **4+ groups** = Breakfast + Snacks + Lunch + Snacks + Dinner
3. **Lunch Detection Logic**: When multiple meal groups occur between breakfast and dinner, the group with the highest total calories is selected as lunch

### 30-Minute Grouping Examples:

#### Scenario 1: Breakfast foods within 30 minutes
- Eggs at 08:00, Juice at 08:15, Coffee at 08:25
- **Result**: All grouped as **Breakfast** (within 30-minute window)

#### Scenario 2: Foods outside 30-minute window
- Eggs at 08:00, Snack at 10:30, Lunch at 13:00
- **Result**: 3 separate groups → **Breakfast**, **Lunch**, **Dinner**

#### Scenario 3: Adding to existing meal via "+ Add to Breakfast"
- Existing: Eggs at 08:00, Juice at 08:15
- Add Bacon at 07:45 via "Add to Breakfast" button
- **Result**: All grouped as **Breakfast** (7:45-8:15 is within expanded window)

### Button Behaviors:

#### "+ Add to [Existing Meal]" Buttons:
- Sets time to fit within existing meal's time range
- Preserves existing meal type grouping
- Example: Breakfast exists at 08:00-08:15, new item gets time ~08:07

#### Main "+" Button:
- Uses current time or user-selected time
- Follows 30-minute grouping rules
- May create new meal groups or join existing ones

### Advanced Examples:

#### Complex Day Timeline:
1. Breakfast: 08:00, 08:10, 08:20 (all breakfast)
2. Snack: 10:45 (separate group, becomes snack)
3. Lunch: 13:00, 13:25 (grouped together as lunch)  
4. Snack: 15:30 (separate group, becomes snack)
5. Dinner: 19:00, 19:15 (grouped together as dinner)

#### Lunch Detection with Multiple Meals Between Breakfast and Dinner:
1. Breakfast: 08:00 (300 calories)
2. Light snack: 11:30 (150 calories) - lunch candidate
3. Main meal: 12:45 (650 calories) - lunch candidate **← Selected as lunch (highest calories)**
4. Small snack: 14:15 (100 calories) - lunch candidate
5. Another snack: 16:30 (200 calories) - lunch candidate
6. Dinner: 19:00 (500 calories)

**Result**: The 12:45 meal becomes lunch because it has the most calories (650) among all groups between breakfast and dinner.

#### Adding via Buttons:
- "Add to Breakfast" → Time set to ~08:10 (middle of breakfast window)
- "Add to Lunch" → Time set to ~13:12 (middle of lunch window)
- New items stay within their target meal groups

### Key Benefits:

1. **Intelligent Grouping** - Foods eaten together stay together
2. **Flexible Timing** - 30-minute window accommodates realistic meal durations  
3. **Button Convenience** - Easy to add multiple foods to the same meal
4. **Automatic Organization** - No manual meal type selection needed

### Technical Implementation:

- Entries sorted by `dateTime`
- Grouped by 30-minute time windows
- Meal types assigned to groups based on chronological position
- Database batch updates when groupings change
- UI shows time-grouped meal sections with individual food items