#!/usr/bin/perl

use strict;
use warnings;

#

use File::Find;
use File::Spec;
use JSON;

#

my( %options, %json, @frm, @png );

#

sub parse_options
{
    $options{'base64'} = 0;

    foreach my $option ( @ARGV )
    {
        $options{'base64'} = 1 if ( $option eq '--base64' );
    }
}

#

sub find_frm
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    $file =~ s!^./!!;

    return if( $file =~ /^_IGNORE_\// );

    push( @frm, $file ) if( $extension eq '.frm' );
    push( @frm, $file ) if( $extension =~ /\.fr[0-5]/ )
}

#

sub find_png
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    $file =~ s!^\./!!;

    push( @png, $file ) if( $extension eq '.png' );
}

#

sub json_info
{
    my %root;

    my $repo = `git remote get-url origin`;
    chomp($repo);

    $repo =~ s![/]+$!!;
    $repo =~ s!\.git$!!;
    $repo .= "/";

    if( $repo =~ m!^https\://github\.com/(.+)/(.+)/$! )
    {
        my( $owner, $name, $branch ) = ( $1, $2, `git branch --format "%(refname:short)"` );
        chomp($branch);

        $root{'url'}{'repository'} = $repo;
        $root{'url'}{'repository-raw'} = sprintf( "https://raw.githubusercontent.com/%s/%s/%s/", $owner, $name, $branch );

        $root{'url'}{'pages'} = sprintf( "https://%s.github.io/%s/", $owner, $name );

    }

    # viewer doesn't follow new specs... yet?
    # $root{'url'}{'specification'} = "https://fodev.net/pastebin/?u=fallout-animations-specification";

    $json{'fallout-animations'}{'INFO'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_frm
{
    my %root;

    foreach my $frm ( sort {$a cmp $b} @frm )
    {
        my( undef, $dir, $file ) = File::Spec->splitpath( $frm );

        $dir =~ s![/]+$!!;

        my $offset = 0;
        $offset = 1 if( $file =~ /^_/ );

        my $set = substr( $file, 0 + $offset, 6 );
        my $anim = uc(substr( $file, 6 + $offset, 2 ));

        printf( "??? $frm\n" ) if( $anim !~ /^[A-R][A-Z]$/ );

        next if( $anim eq 'NA' );

        # it's easier to store entries initially as arrays...

        if( $options{'base64'} == 1 )
        {
            my $base64 = `base64 --wrap 0 $frm`;
            push( @{ $root{"$dir"}{"$anim"} },
            {
                data => "$base64",
                name => "$file"
            });
        }
        else
        {
            push( @{ $root{"$dir"}{"$anim"} }, $file );
        }
    }

    # ...and change them to string if they contain only one element

    foreach my $dir ( keys( %root ))
    {
        foreach my $anim ( keys( %{ $root{"$dir"} }))
        {
            my $size = scalar(@{ $root{"$dir"}{"$anim"} });

            if( $size == 1)
            {
                my $data = $root{"$dir"}{"$anim"}[0];

                $root{"$dir"}{"$anim"} = $data;
            }
            elsif( $size == 7 )
            {
               pop( @{ $root{"$dir"}{"$anim"} } );
            }
        }
    }

    $json{'fallout-animations'}{'frm'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_png
{
    my %root;

    foreach my $png ( sort {$a cmp $b} @png )
    {
        my( undef, $dir, $file ) = File::Spec->splitpath( $png );

        $dir =~ s!^docs/!!;
        $dir =~ s![/]+$!!;

        my $offset = 0;
        $offset = 1 if( $file =~ /^_/ );

        my $set  = substr( $file, 0 + $offset, 6 );
        my $anim = uc(substr( $file, 6 + $offset, 2 ));

        if( $file =~ /^[_]?$set$anim\.png$/ )
        {
            $root{"$dir"}{"$anim"}{'anim-packed'} = $file;
        }
        elsif( $file =~ /^[_]?$set$anim\_([0-5])\.png$/ )
        {
            push( @{ $root{"$dir"}{"$anim"}{'anim'} }, $file );
        }
        elsif( $file =~ /\.static\.png$/ )
        {
            push( @{ $root{"$dir"}{"$anim"}{'static'} }, $file );
        }
        else
        {
            print( "??? $file\n" );
        }
    }

    $json{'fallout-animations'}{'png'} = \%root
        if( scalar(keys( %root )));
}

#

sub json_txt
{
    my %root;

    $root{"AA"} = "Unarmed - Stand";
    $root{"AB"} = "Unarmed - Walk";
    $root{"AE"} = "Climb ladder";
    $root{"AG"} = "Up stairs right";
    $root{"AH"} = "Up stairs left";
    $root{"AI"} = "Down stairs right";
    $root{"AJ"} = "Down stairs left";
    $root{"AK"} = "Magic hands ground";
    $root{"AL"} = "Magic hands middle";
    $root{"AN"} = "Unarmed - Doge";
    $root{"AO"} = "Hit from front";
    $root{"AP"} = "Hit from back";
    $root{"AQ"} = "Throw punch";
    $root{"AR"} = "Kick leg";
    $root{"AS"} = "Throwing";
    $root{"AT"} = "Running";

    $root{"BA"} = "Fall back";
    $root{"BB"} = "Fall front";
    $root{"BC"} = "Bad landing";
    $root{"BD"} = "Big hole";
    $root{"BE"} = "Charred body";
    $root{"BF"} = "Chunks of flesh";
    $root{"BG"} = "Dancing autofire";
    $root{"BH"} = "Electrify";
    $root{"BI"} = "Sliced in half";
    $root{"BJ"} = "Burned to nothing";
    $root{"BK"} = "Electrified to nothing";
    $root{"BL"} = "Exploded to nothing";
    $root{"BM"} = "Melted to nothing";
    $root{"BN"} = "Fire dance";
    $root{"BO"} = "Fall back blood";
    $root{"BP"} = "Fall front blood";

    $root{"CH"} = "Prone to standing";
    $root{"CJ"} = "Back to standing";

    $root{"DA"} = "Knife - Stand";
    $root{"DB"} = "Knife - Walk";
    $root{"DC"} = "Knife - Draw";
    $root{"DD"} = "Knife - Holster";
    $root{"DE"} = "Knife - Dodge ";
    $root{"DF"} = "Knife - Thrust";
    $root{"DG"} = "Knife - Swing";
    $root{"DM"} = "Knife - Throw";

    $root{"EA"} = "Club - Stand";
    $root{"EB"} = "Club - Walk";
    $root{"EC"} = "Club - Draw";
    $root{"ED"} = "Club - Holster";
    $root{"EE"} = "Club - Dodge";
    $root{"EF"} = "Club - Thrust";
    $root{"EG"} = "Club - Swing";

    $root{"FA"} = "Hammer - Stand";
    $root{"FB"} = "Hammer - Walk";
    $root{"FC"} = "Hammer - Draw";
    $root{"FD"} = "Hammer - Holster";
    $root{"FE"} = "Hammer - Dodge";
    $root{"FF"} = "Hammer - Thrust";
    $root{"FG"} = "Hammer - Swing";

    $root{"GA"} = "Spear - Stand";
    $root{"GB"} = "Spear - Walk";
    $root{"GC"} = "Spear - Draw";
    $root{"GD"} = "Spear - Holster";
    $root{"GE"} = "Spear - Dodge";
    $root{"GF"} = "Spear - Thrust";
    $root{"GM"} = "Spear - Throwing";

    $root{"HA"} = "Pistol - Stand";
    $root{"HB"} = "Pistol - Walk";
    $root{"HC"} = "Pistol - Draw";
    $root{"HD"} = "Pistol - Holster";
    $root{"HE"} = "Pistol - Dodge";
    $root{"HH"} = "Pistol - Weapon Up";
    $root{"HI"} = "Pistol - Weapon Down";
    $root{"HJ"} = "Pistol - Fire single";
    $root{"HK"} = "Pistol - Fire burst";
    $root{"HL"} = "Pistol - Fire continuous";

    $root{"IA"} = "SMG - Stand";
    $root{"IB"} = "SMG - Walk";
    $root{"IC"} = "SMG - Draw";
    $root{"ID"} = "SMG - Holster";
    $root{"IE"} = "SMG - Dodge";
    $root{"IH"} = "SMG - Weapon Up";
    $root{"II"} = "SMG - Weapon Down";
    $root{"IJ"} = "SMG - Fire single";
    $root{"IK"} = "SMG - Fire burst";
    $root{"IL"} = "SMG - Fire continuous";

    $root{"JA"} = "Rifle - Stand";
    $root{"JB"} = "Rifle - Walk";
    $root{"JC"} = "Rifle - Draw";
    $root{"JD"} = "Rifle - Holster";
    $root{"JE"} = "Rifle - Dodge";
    $root{"JH"} = "Rifle - Weapon Up";
    $root{"JI"} = "Rifle - Weapon Down";
    $root{"JJ"} = "Rifle - Fire single";
    $root{"JK"} = "Rifle - Fire burst";
    $root{"JL"} = "Rifle - Fire continuous";

    $root{"KA"} = "Big Gun - Stand";
    $root{"KB"} = "Big Gun - Walk";
    $root{"KC"} = "Big Gun - Draw";
    $root{"KD"} = "Big Gun - Holster";
    $root{"KE"} = "Big Gun - Dodge";
    $root{"KH"} = "Big Gun - Weapon Up";
    $root{"KI"} = "Big Gun - Weapon Down";
    $root{"KJ"} = "Big Gun - Fire single";
    $root{"KK"} = "Big Gun - Fire burst";
    $root{"KL"} = "Big Gun - Fire continuous";

    $root{"LA"} = "Minigun - Stand";
    $root{"LB"} = "Minigun - Walk";
    $root{"LC"} = "Minigun - Draw";
    $root{"LD"} = "Minigun - Holster";
    $root{"LE"} = "Minigun - Dodge";
    $root{"LH"} = "Minigun - Weapon Up";
    $root{"LI"} = "Minigun - Weapon Down";
    $root{"LJ"} = "Minigun - Fire single";
    $root{"LK"} = "Minigun - Fire burst";
    $root{"LL"} = "Minigun - Fire continuous";

    $root{"MA"} = "Rocket Launcher - Stand";
    $root{"MB"} = "Rocket Launcher - Walk";
    $root{"MC"} = "Rocket Launcher - Draw";
    $root{"MD"} = "Rocket Launcher - Holster";
    $root{"ME"} = "Rocket Launcher - Dodge";
    $root{"MH"} = "Rocket Launcher - Weapon Up";
    $root{"MI"} = "Rocket Launcher - Weapon Down";
    $root{"MJ"} = "Rocket Launcher - Fire single";
    $root{"MK"} = "Rocket Launcher - Fire burst";
    $root{"ML"} = "Rocket Launcher - Fire continuous";

    $root{"RA"} = "Fall back (single frame)";
    $root{"RB"} = "Fall front (single frame)";
    $root{"RC"} = "Bad landing (single frame)";
    $root{"RD"} = "Big hole (single frame)";
    $root{"RE"} = "Charred body (single frame)";
    $root{"RF"} = "Chunks of flesh (single frame)";
    $root{"RG"} = "Dancing autofire (single frame)";
    $root{"RH"} = "Electrify (single frame)";
    $root{"RI"} = "Siled in half (single frame)";
    $root{"RJ"} = "Burned to nothing (single frame)";
    $root{"RK"} = "Electrified to nothing (single frame)";
    $root{"RL"} = "Exploded to nothing (single frame)";
    $root{"RM"} = "Melted to nothing (single frame)";
    $root{"RN"} = "Called shot pic";
    $root{"RO"} = "Fall back blood (single frame)";
    $root{"RP"} = "Fall front blood (single frame)";

    $json{'fallout-animations'}{'txt'} = \%root;
}

#

&parse_options();

&find({ wanted => \&find_frm, no_chdir => 1 }, '.');
&find({ wanted => \&find_png, no_chdir => 1 }, 'docs' );

&json_info();
&json_frm();
&json_png();
&json_txt();

if( open( my $file, ">", "docs/fallout-animations.json" ))
{
    print( $file JSON->new->pretty->canonical->encode(\%json));
    close( $file );
}
else
{
    print( "Cannot write: docs/fallout-animations.json\n\n" );
    exit 1;
}
