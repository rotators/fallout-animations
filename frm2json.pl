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
    $options{base64} = 0;

    foreach my $option ( @ARGV )
    {
        $options{base64} = 1 if ( $option eq '--base64' );
    }
}

#

sub find_frm
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

    push( @frm, $file ) if( $extension eq '.frm' );
    push( @frm, $file ) if( $extension =~ /\.fr[0-5]/ )
}

#

sub find_png
{
    my $file = $File::Find::name;
    my $extension = lc(substr($file, -4));

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

    # viewer doesnt follow new specs... yet?
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
        $frm =~ s!^\./!!;

        my( undef, $dir, $file ) = File::Spec->splitpath( $frm );

        $dir =~ s![/]+$!!;

        my $offset = 0;
        $offset = 1 if( $file =~ /^_/ );

        my $set = substr( $file, 0 + $offset, 6 );
        my $anim = uc(substr( $file, 6 + $offset, 2 ));

        printf( "??? $frm\n" ) if( $anim !~ /^[A-R][A-Z]$/ );

        next if( $anim eq 'NA' );

        # it's easier to store entries initially as arrays...

        if( $options{base64} == 1 )
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
        $png =~ s!^\./!!;

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

    $json{'fallout-animations-extra'}{'txt'} = \%root
        if( scalar(keys( %root )))
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
