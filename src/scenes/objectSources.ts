// Canonical {textureKey: spriteSlot} mapping that drives in-game
// rendering. Lives in its own module so consumers without a Phaser
// dependency (e.g. the map-editor data layer, the sprites library
// page mirror) can import the same source-of-truth without dragging
// Phaser into their bundle.
//
// BootScene.preload() iterates this dict to register every key as a
// loaded image. The map editor mirrors the dict as its sprite
// catalog. Keep both in sync by editing here and only here.
//
// Slot names map onto files under public/sprites/objects-raw/:
//   <slot>.png — e.g. 'obj1_0_1' → public/sprites/objects-raw/obj1_0_1.png

export const OBJECT_SOURCES: Record<string, string> = {
  // ===== Canonical replacements (override procedural draws) =====
  h_counter:    'obj1_0_0', // reception desk
  // Canonical desk uses the desks.png sheet (3rd in row 1: wood
  // desk + monitor + plant). The 12-desk sheet is registered below
  // as h_desk_1..h_desk_12 (row-major from desks.png) so we can swap
  // visual variants per-instance without re-importing.
  h_desk:       'desks_0_2',
  h_chair:      'obj1_0_2', // office chair
  h_cabinet:    'obj1_0_3', // filing cabinet (with plant on top)
  h_bulletin:   'obj1_1_0', // cork bulletin board
  h_plant:      'obj1_1_1', // potted fern
  h_water:      'obj1_2_1', // water cooler
  h_vending:    'obj1_2_2', // snack vending machine
  h_bed:        'obj3_0_0', // hospital bed
  h_equipment:  'obj3_1_3', // vital monitor on cart
  h_fax:        'obj5_1_0', // fax machine

  // ===== New keys registered for future placement =====
  // Sheet 1 — office / lobby
  h_computer:        'obj1_1_2',
  h_printer:         'obj1_1_3',
  h_box_stack:       'obj1_2_0',
  h_armchair:        'obj1_2_3',
  h_stanchion:       'obj1_3_0',
  h_clock_wall:      'obj1_3_1',
  h_supply_cart:     'obj1_3_2',
  h_kiosk:           'obj1_3_3',
  // Sheet 2 — waiting / lobby
  h_couch:           'obj2_0_0',
  h_bench:           'obj2_0_1',
  h_side_table:      'obj2_0_2',
  h_brochure:        'obj2_0_3',
  h_directory:       'obj2_1_0',
  h_sanitizer:       'obj2_1_1',
  h_coat_rack:       'obj2_1_2',
  h_trash:           'obj2_1_3',
  h_recycle:         'obj2_2_0',
  h_plant_lobby:     'obj2_2_1',
  h_reception_bell:  'obj2_2_2',
  h_atm:             'obj2_2_3',
  h_monitor_wall:    'obj2_3_0',
  h_tablet:          'obj2_3_1',
  h_umbrella_stand:  'obj2_3_2',
  h_signin:          'obj2_3_3',
  // Sheet 3 — clinical / medical
  h_exam_table:      'obj3_0_1',
  h_iv_stand:        'obj3_0_2',
  h_wheelchair:      'obj3_0_3',
  h_stool:           'obj3_1_0',
  h_bedside:         'obj3_1_1',
  h_screen:          'obj3_1_2',
  h_med_cart:        'obj3_2_0',
  h_crash_cart:      'obj3_2_1',
  h_sink:            'obj3_2_2',
  h_biohazard:       'obj3_2_3',
  h_linen_cart:      'obj3_3_0',
  h_step:            'obj3_3_1',
  h_equip_cart:      'obj3_3_2',
  h_gurney:          'obj3_3_3',
  // Sheet 4 — facilities / safety
  h_cleaning_cart:   'obj4_0_0',
  h_mop_bucket:      'obj4_0_1',
  h_wet_floor:       'obj4_0_2',
  h_bin_cart:        'obj4_0_3',
  h_supply_cart_2:   'obj4_1_0',
  h_bin_cart_full:   'obj4_1_1',
  h_biohazard_sm:    'obj4_1_2',
  h_linen_bin:       'obj4_1_3',
  h_paper_towels:    'obj4_2_0',
  h_elevator:        'obj4_2_1',
  h_drink_counter:   'obj4_2_2',
  h_fountain:        'obj4_2_3',
  h_aed:             'obj4_3_0',
  h_payphone:        'obj4_3_1',
  h_arrow_sign:      'obj4_3_2',
  h_clock_office:    'obj4_3_3',
  // Sheet 5 — admin / records
  h_bookshelf:       'obj5_0_0',
  h_file_cart:       'obj5_0_1',
  h_cabinet_open:    'obj5_0_2',
  h_lamp:            'obj5_0_3',
  h_kiosk_admin:     'obj5_1_1',
  h_intercom:        'obj5_1_2',
  h_pneumatic:       'obj5_1_3',
  h_test_tubes:      'obj5_2_0',
  h_printer_lab:     'obj5_2_1',
  h_shredder:        'obj5_2_2',
  h_cashbox:         'obj5_2_3',
  h_med_vending:     'obj5_3_0',
  h_reception_admin: 'obj5_3_1',
  h_ticker:          'obj5_3_2',
  h_paper_stack:     'obj5_3_3',
}

// Variant texture keys (h_desk_1..12, h_plant_1..20). Generated
// programmatically since they follow a simple row-major rule on the
// desks.png + plants.png contact sheets. Merged into OBJECT_SOURCES
// here so consumers see one unified table.
for (let i = 1; i <= 12; i++) {
  const r = Math.floor((i - 1) / 3)
  const c = (i - 1) % 3
  OBJECT_SOURCES[`h_desk_${i}`] = `desks_${r}_${c}`
}
for (let i = 1; i <= 20; i++) {
  const r = Math.floor((i - 1) / 5)
  const c = (i - 1) % 5
  OBJECT_SOURCES[`h_plant_${i}`] = `plants_${r}_${c}`
}
