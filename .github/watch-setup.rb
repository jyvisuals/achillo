# Adds the Apple Watch app target to the Xcode project (run on a Mac by .github/workflows/watch-setup.yml).
require 'xcodeproj'
proj = Xcodeproj::Project.open('App.xcodeproj')
if proj.targets.any? { |t| t.name == 'AchilloWatch' }
  puts 'Watch target already there'
  exit 0
end
app = proj.targets.find { |t| t.name == 'App' }
version = app.build_configurations.first.build_settings['MARKETING_VERSION'] || '1.0'
watch = proj.new_target(:application, 'AchilloWatch', :watchos, '10.0', nil, :swift)
group = proj.main_group.new_group('AchilloWatch', 'AchilloWatch')
%w[AchilloWatchApp.swift SessionModel.swift ContentView.swift].each do |f|
  watch.source_build_phase.add_file_reference(group.new_reference(f))
end
watch.resources_build_phase.add_file_reference(group.new_reference('Assets.xcassets'))
group.new_reference('Info.plist')
watch.build_configurations.each do |c|
  s = c.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.jyvisuals.achilles.watchkitapp'
  s['PRODUCT_NAME'] = 'AchilloWatch'
  s['INFOPLIST_FILE'] = 'AchilloWatch/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'YES'
  s['INFOPLIST_KEY_CFBundleDisplayName'] = 'Achilló'
  s['INFOPLIST_KEY_WKCompanionAppBundleIdentifier'] = 'com.jyvisuals.achilles'
  s['INFOPLIST_KEY_UISupportedInterfaceOrientations'] = 'UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown'
  s['SDKROOT'] = 'watchos'
  s['SUPPORTED_PLATFORMS'] = 'watchos watchsimulator'
  s['TARGETED_DEVICE_FAMILY'] = '4'
  s['WATCHOS_DEPLOYMENT_TARGET'] = '10.0'
  s['SWIFT_VERSION'] = '5.0'
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['DEVELOPMENT_TEAM'] = '4GP6GFRGCR'
  s['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  s['MARKETING_VERSION'] = version
  s['CURRENT_PROJECT_VERSION'] = '1'
  s['SKIP_INSTALL'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
end
app.add_dependency(watch)
embed = app.new_copy_files_build_phase('Embed Watch Content')
embed.dst_subfolder_spec = '16'
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
bf = embed.add_file_reference(watch.product_reference, true)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
proj.save
puts 'Added AchilloWatch target'
